import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { generateQueryEmbedding } from '@/lib/cohere';
import { getPineconeIndex } from '@/lib/pinecone';

// POST /api/search — semantic search using Cohere + Pinecone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, limit = 10 } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [], query: '' });
    }

    await connectDB();

    // Generate query embedding with Cohere
    const queryEmbedding = await generateQueryEmbedding(query.trim());

    // Search Pinecone for similar vectors
    const index = await getPineconeIndex();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pineconeFilter: any = { type: 'item' };

    const pineconeResults = await index.query({
      vector: queryEmbedding,
      topK: limit * 2, // Fetch more, then filter
      filter: pineconeFilter,
      includeMetadata: true,
    });

    if (!pineconeResults.matches.length) {
      // Fallback to MongoDB text search
      const textResults = await Item.find({
        $text: { $search: query },
        isArchived: false,
        ...(type ? { type } : {}),
      })
        .limit(limit)
        .lean();

      return NextResponse.json({
        results: textResults.map((item) => ({ item, score: 0.7, matchType: 'text' })),
        query,
        totalFound: textResults.length,
        searchType: 'text-fallback',
      });
    }

    // Get all matched item IDs from Pinecone
    const matches = pineconeResults.matches.filter((m) => m.score && m.score > 0.5);
    const itemIds = matches.map((m) => (m.metadata as { itemId: string }).itemId);

    // Fetch full items from MongoDB
    const items = await Item.find({
      _id: { $in: itemIds },
      isArchived: false,
      ...(type ? { type } : {}),
    }).lean();

    // Merge with scores and sort by score
    const itemMap = new Map(items.map((item) => [item._id.toString(), item]));
    const results = matches
      .map((match) => ({
        item: itemMap.get((match.metadata as { itemId: string }).itemId),
        score: match.score ?? 0,
        matchType: 'semantic' as const,
      }))
      .filter((r) => r.item !== undefined)
      .slice(0, limit);

    return NextResponse.json({
      results,
      query,
      totalFound: results.length,
      searchType: 'semantic',
    });
  } catch (error) {
    console.error('POST /api/search error:', error);
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
  }
}
