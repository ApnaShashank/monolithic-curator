import { Pinecone } from '@pinecone-database/pinecone';

let pineconeInstance: Pinecone | null = null;

export function getPinecone() {
  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeInstance;
}

export async function getPineconeIndex() {
  const pinecone = getPinecone();
  const indexName = process.env.PINECONE_INDEX || 'monolithic-curator';
  
  try {
    const index = pinecone.index(indexName);
    return index;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      throw new Error(`Pinecone Index '${indexName}' not found. Please create it in your Pinecone dashboard with Dimension: 1024 and Metric: Cosine.`);
    }
    throw error;
  }
}
