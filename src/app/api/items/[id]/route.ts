import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { getPineconeIndex } from '@/lib/pinecone';

// GET /api/items/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id).lean();
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // Update lastAccessedAt
    await Item.findByIdAndUpdate(id, { lastAccessedAt: new Date() });

    // Fetch related items via Pinecone
    let related: unknown[] = [];
    if ((item as { embeddingId?: string }).embeddingId) {
      try {
        const index = await getPineconeIndex();
        const embeddingId = (item as { embeddingId: string }).embeddingId;
        const vectors = await index.fetch({ ids: [embeddingId] });
        const vec = vectors.records[embeddingId];
        if (vec?.values) {
          const results = await index.query({
            vector: vec.values,
            topK: 6,
            filter: { type: 'item' },
          });
          const relatedIds = results.matches
            .filter((m) => m.id !== embeddingId)
            .map((m) => ({
              itemId: (m.metadata as { itemId: string }).itemId,
              score: m.score,
            }));
          
          const rawItems = await Item.find({ _id: { $in: relatedIds.map(r => r.itemId) } })
            .select('title type tags thumbnail summary')
            .lean();
          
          // Attach scores
          related = rawItems.map(item => ({
            ...item,
            score: relatedIds.find(r => r.itemId === item._id.toString())?.score || 0
          })).sort((a, b) => (b as any).score - (a as any).score);
        }
      } catch (e) {
        console.error('Pinecone related fetch failed:', e);
      }
    }

    return NextResponse.json({ item, related });
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PATCH /api/items/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const allowed = ['title', 'url', 'type', 'content', 'tags', 'summary', 'highlights', 'isArchived', 'isBookmarked', 'collections'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowed.includes(key))
    );
    const item = await Item.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('PATCH /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const embeddingId = (item as { embeddingId?: string }).embeddingId;
    if (embeddingId) {
      try {
        const index = await getPineconeIndex();
        await index.deleteMany([embeddingId]);
      } catch (e) {
        console.error('Pinecone delete failed:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
