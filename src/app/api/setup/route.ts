import { NextResponse } from 'next/server';
import { getPinecone } from '@/lib/pinecone';

// GET /api/setup — one-time setup: create Pinecone index
export async function GET() {
  try {
    const pinecone = getPinecone();
    const indexName = process.env.PINECONE_INDEX || 'monolithic-curator';

    // Check if index exists
    const { indexes } = await pinecone.listIndexes();
    const exists = indexes?.some((idx) => idx.name === indexName);

    if (!exists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1024, // Cohere embed-english-v3.0 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      return NextResponse.json({
        message: `Index "${indexName}" created successfully. Wait 30-60 seconds before saving items.`,
        created: true,
      });
    }

    return NextResponse.json({
      message: `Index "${indexName}" already exists. Ready to use!`,
      created: false,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
