import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import Collection from '@/models/Collection';
import { getPineconeIndex } from '@/lib/pinecone';

export async function POST() {
  try {
    await connectDB();

    // 1. Fetch items that are NOT in any collection yet
    const items = await Item.find({ collections: { $size: 0 }, embeddingId: { $exists: true } })
      .select('_id title embeddingId')
      .limit(50)
      .lean();

    if (items.length < 3) {
      return NextResponse.json({ message: 'Not enough new items to cluster. Need at least 3.' });
    }

    // 2. Simple grouping logic: For each item, find its nearest neighbor in Pinecone
    // and if the similarity is high, suggest a collection.
    // For a production app, we would use K-Means, but here we can do a "seed" approach.
    
    const index = await getPineconeIndex();
    const suggestions: Array<{ itemId: string; title: string; suggestedCollection: string }> = [];

    for (const item of items) {
      const vectors = await index.fetch({ ids: [item.embeddingId!] });
      const vec = vectors.records[item.embeddingId!];
      
      if (vec?.values) {
        const results = await index.query({
          vector: vec.values,
          topK: 3,
          filter: { type: 'item' },
        });

        const neighbors = results.matches?.filter(m => (m.metadata as any).itemId !== item._id.toString() && (m.score ?? 0) > 0.85);

        if (neighbors && neighbors.length > 0) {
          // Suggest a collection name based on the top neighbor's title or tags
          const neighborItem = await Item.findById((neighbors[0].metadata as any).itemId).select('tags title').lean();
          const suggestedName = neighborItem?.tags[0] || 'Uncategorized Group';
          
          suggestions.push({
            itemId: item._id.toString(),
            title: item.title,
            suggestedCollection: suggestedName
          });
        }
      }
    }

    return NextResponse.json({ 
      message: 'AI Clustering Complete', 
      suggestions,
      count: suggestions.length 
    });
  } catch (error) {
    console.error('POST /api/collections/cluster error:', error);
    return NextResponse.json({ error: 'Clustering failed' }, { status: 500 });
  }
}
