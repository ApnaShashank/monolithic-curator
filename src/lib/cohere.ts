import { CohereClient } from 'cohere-ai';

let cohereInstance: CohereClient | null = null;

export function getCohere() {
  if (!cohereInstance) {
    cohereInstance = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });
  }
  return cohereInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cohere = getCohere();
  const response = await cohere.embed({
    texts: [text.slice(0, 2048)], // Cohere max input
    model: 'embed-english-v3.0',
    inputType: 'search_document',
  });
  const embeddings = response.embeddings;
  if (!embeddings) throw new Error('No embeddings returned from Cohere');

  // SDK v8 + v3 models return an object with float property
  if (typeof embeddings === 'object' && !Array.isArray(embeddings)) {
    const floatEmbeds = (embeddings as any).float;
    if (Array.isArray(floatEmbeds) && Array.isArray(floatEmbeds[0])) {
      return floatEmbeds[0] as number[];
    }
  }

  // Fallback/Legacy/v2 models (direct array)
  if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
    return embeddings[0] as number[];
  }
  
  console.error('[Cohere Lib] Unexpected Format:', typeof embeddings, Array.isArray(embeddings));
  throw new Error('Unexpected embedding format from Cohere: ' + JSON.stringify(embeddings).slice(0, 100));
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const cohere = getCohere();
  const response = await cohere.embed({
    texts: [query.slice(0, 2048)],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
  });
  const embeddings = response.embeddings;
  if (!embeddings) throw new Error('No embeddings returned from Cohere');

  // SDK v8 + v3 models return an object with float property
  if (typeof embeddings === 'object' && !Array.isArray(embeddings)) {
    const floatEmbeds = (embeddings as any).float;
    if (Array.isArray(floatEmbeds) && Array.isArray(floatEmbeds[0])) {
      return floatEmbeds[0] as number[];
    }
  }

  // Fallback/Legacy/v2 models (direct array)
  if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
    return embeddings[0] as number[];
  }
  
  console.error('[Cohere Lib] Unexpected Format:', typeof embeddings, Array.isArray(embeddings));
  throw new Error('Unexpected embedding format from Cohere: ' + JSON.stringify(embeddings).slice(0, 100));
}

export async function generateTags(title: string, content: string): Promise<string[]> {
  const cohere = getCohere();
  const text = `Title: ${title}\n\nContent: ${content.slice(0, 1000)}`;
  const response = await cohere.chat({
    model: 'command-r-plus-08-2024',
    message: `Extract 3-5 relevant topic tags from this content. Return ONLY a JSON array of lowercase tags with no spaces (use hyphens). Example: ["machine-learning", "ai", "neural-networks"]\n\n${text}`,
  });
  try {
    const match = response.text.match(/\[[\s\S]*?\]/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback
  }
  return ['uncategorized'];
}

export async function generateSummary(title: string, content: string): Promise<string> {
  const cohere = getCohere();
  const response = await cohere.chat({
    model: 'command-r-plus-08-2024',
    message: `Summarize this content in 2-3 sentences. Be concise and informative.\n\nTitle: ${title}\n\nContent: ${content.slice(0, 2000)}`,
  });
  return response.text;
}
