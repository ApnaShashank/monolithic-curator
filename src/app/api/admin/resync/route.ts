import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { generateEmbedding, generateTags, generateSummary } from '@/lib/cohere';
import { getPineconeIndex } from '@/lib/pinecone';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Find items with missing AI data
    const itemsToResync = await Item.find({
      $or: [
        { tags: { $size: 0 } },
        { summary: { $exists: false } },
        { summary: "" },
        { embeddingId: { $exists: false } }
      ]
    }).limit(10); // Process in small batches for safety

    if (itemsToResync.length === 0) {
      return NextResponse.json({ message: 'All items are fully synced.' });
    }

    const results = await Promise.all(itemsToResync.map(async (item) => {
      try {
        const textForAI = `${item.title}\n\n${item.content || item.title}`.slice(0, 3000);
        
        const [embedding, tags, summary] = await Promise.all([
          generateEmbedding(textForAI),
          generateTags(item.title, item.content || item.title),
          (item.content || "").length > 50 ? generateSummary(item.title, item.content || "") : Promise.resolve(''),
        ]);

        // Upsert to Pinecone
        const index = await getPineconeIndex();
        const embeddingId = `item_${item._id}`;
        await index.upsert({
          records: [{
            id: embeddingId,
            values: embedding,
            metadata: { itemId: item._id.toString(), title: item.title, type: 'item' },
          }]
        });

        // Update MongoDB
        await Item.findByIdAndUpdate(item._id, {
          tags,
          summary,
          embeddingId,
        });

        return { id: item._id, status: 'success' };
      } catch (err: any) {
        return { id: item._id, status: 'failed', error: err.message };
      }
    }));

    return NextResponse.json({ 
      processed: results.length,
      results 
    });

  } catch (error: any) {
    console.error('Resync API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
