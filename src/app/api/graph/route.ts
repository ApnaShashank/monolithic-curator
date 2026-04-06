import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { getPineconeIndex } from '@/lib/pinecone';

// GET /api/graph — get knowledge graph nodes and edges
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    const items = await Item.find({ userId, isArchived: false })
      .select('_id title type tags url source siteName metadata embeddingId createdAt')
      .limit(100)
      .lean();

    if (items.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], stats: { nodes: 0, connections: 0 } });
    }

    // Build nodes
    const nodes = items.map((item) => ({
      id: item._id.toString(),
      label: item.title,
      type: item.type,
      tags: item.tags,
      url: item.url,
      source: item.siteName || item.source,
      author: item.metadata?.author,
      createdAt: item.createdAt,
      size: Math.max(6, Math.min(20, item.tags.length * 3 + 6)),
    }));

    // Build edges from shared tags
    const edges: Array<{ source: string; target: string; weight: number; reason: string }> = [];
    const edgeSet = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const tagsA = new Set(items[i].tags);
        const tagsB = new Set(items[j].tags);
        const sharedTags = [...tagsA].filter((t) => tagsB.size > 0 && tagsB.has(t));

        if (sharedTags.length > 0) {
          const ids = [items[i]._id.toString(), items[j]._id.toString()].sort();
          const edgeKey = `tag-${ids[0]}-${ids[1]}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              source: items[i]._id.toString(),
              target: items[j]._id.toString(),
              weight: sharedTags.length,
              reason: sharedTags.slice(0, 2).join(', '),
            });
          }
        }

        // Same type connection (weaker)
        if (sharedTags.length === 0 && items[i].type === items[j].type) {
          const ids = [items[i]._id.toString(), items[j]._id.toString()].sort();
          const edgeKey = `type-${ids[0]}-${ids[1]}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              source: items[i]._id.toString(),
              target: items[j]._id.toString(),
              weight: 1,
              reason: `same type: ${items[i].type}`,
            });
          }
        }

        // Same day connection
        if (items[i].createdAt && items[j].createdAt) {
          const dayA = new Date(items[i].createdAt).toDateString();
          const dayB = new Date(items[j].createdAt).toDateString();
          if (dayA === dayB) {
            const ids = [items[i]._id.toString(), items[j]._id.toString()].sort();
            const edgeKey = `day-${ids[0]}-${ids[1]}`;
            if (!edgeSet.has(edgeKey)) {
              edgeSet.add(edgeKey);
              edges.push({
                source: items[i]._id.toString(),
                target: items[j]._id.toString(),
                weight: 1,
                reason: 'saved same day',
              });
            }
          }
        }
      }
    }

    // Also try to find vector-based connections for items that have embeddings
    const itemsWithEmbeddings = items.filter((i) => i.embeddingId);
    if (itemsWithEmbeddings.length >= 2) {
      try {
        const index = await getPineconeIndex();
        // Sample 5 items for vector similarity
        const sampleItems = itemsWithEmbeddings.slice(0, 5);
        for (const item of sampleItems) {
          const vectors = await index.fetch({ ids: [item.embeddingId!] });
          const vec = vectors.records[item.embeddingId!];
          if (vec?.values) {
            const results = await index.query({
              vector: vec.values,
              topK: 4,
              filter: { userId: userId }, // Strict user filtering in Pinecone
            });
            results.matches
              .filter((m) => m.id !== item.embeddingId && m.score && m.score > 0.7)
              .forEach((match) => {
                const targetId = (match.metadata as { itemId: string }).itemId;
                const ids = [item._id.toString(), targetId].sort();
                const edgeKey = `semantic-${ids[0]}-${ids[1]}`;
                if (!edgeSet.has(edgeKey)) {
                  edgeSet.add(edgeKey);
                  edges.push({
                    source: item._id.toString(),
                    target: targetId,
                    weight: Math.round((match.score ?? 0) * 10),
                    reason: 'semantic similarity',
                  });
                }
              });
          }
        }
      } catch (e) {
        console.error('Vector graph edges failed:', e);
      }
    }

    return NextResponse.json({
      nodes,
      edges,
      stats: { nodes: nodes.length, connections: edges.length },
    });
  } catch (error) {
    console.error('GET /api/graph error:', error);
    return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 });
  }
}
