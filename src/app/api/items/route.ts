import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { generateEmbedding, generateTags, generateSummary } from '@/lib/cohere';
import { getPineconeIndex } from '@/lib/pinecone';
import { getUrlMetadata, detectType } from '@/lib/scraper';

// GET /api/items — fetch all items with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const archived = searchParams.get('archived') === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { isArchived: archived };
    if (type) filter.type = type;
    if (tag) filter.tags = tag;
    if (collection) filter.collections = collection;

    const sortOrder = sort === 'oldest' ? 1 : -1;

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Item.countDocuments(filter),
    ]);

    const tagCounts = await Item.aggregate([
      { $match: { isArchived: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const typeCounts = await Item.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tagCounts: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
      typeCounts: typeCounts.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
    });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items — save a new item with rich metadata
export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    await connectDB();

    body = await request.json();
    let { title, url, type, content, thumbnail, source, metadata, collections } = body;

    if (!url && !title) {
      return NextResponse.json({ error: 'Title or URL is required' }, { status: 400 });
    }

    if (!type && url) {
      type = detectType(url);
    }

    // Rich metadata extraction
    let favicon: string | undefined;
    let siteName: string | undefined;

    if (url) {
      try {
        const isDefaultTitle = !title || title.trim() === url.trim() || title === 'Untitled Entry';
        const extracted = await getUrlMetadata(url, type);
        
        if (extracted) {
          title = isDefaultTitle ? (extracted.title || title) : title;
          content = (!content || content.trim().length === 0) ? (extracted.description || '') : content;
          thumbnail = thumbnail || extracted.thumbnail;
          favicon = extracted.favicon;
          siteName = extracted.siteName;
          
          metadata = {
            ...metadata,
            author: metadata?.author || extracted.author,
            publishedAt: metadata?.publishedAt || extracted.publishedDate,
            wordCount: extracted.wordCount,
            locale: extracted.locale,
            socialLinks: extracted.socialLinks || [],
            hashtags: extracted.hashtags || [],
          };

          if (extracted.tags) {
            metadata = { ...metadata, youtubeTags: extracted.tags };
          }
        }
      } catch (scrapeError) {
        console.warn('Scraping failed, falling back to manual input:', scrapeError);
      }
    }

    const item = await Item.create({
      title: title?.trim() || url || 'Untitled Entry',
      url,
      type: type || 'link',
      content: content || '',
      thumbnail,
      favicon,
      siteName,
      source: source || (url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'manual'),
      metadata,
      tags: [],
      collections: collections || [],
    });

    // Background AI processing (non-blocking)
    processItemWithAI(item._id.toString(), title || url || '', content || title || '')
      .catch((err) => console.error('AI processing failed:', err));

    return NextResponse.json(
      { item, message: 'Captured. Processing AI enrichment...' }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/items error:', error, 'Body:', body);
    return NextResponse.json(
      { error: 'Failed to save item', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

// AI processing pipeline
async function processItemWithAI(itemId: string, title: string, content: string) {
  await connectDB();

  const textForAI = `${title}\n\n${content}`.slice(0, 3000);

  const [embedding, tags, summary] = await Promise.all([
    generateEmbedding(textForAI),
    generateTags(title, content),
    content.length > 50 ? generateSummary(title, content) : Promise.resolve(''),
  ]);

  const index = await getPineconeIndex();
  const embeddingId = `item_${itemId}`;

  if (!embedding || embedding.length === 0) {
    console.error('[AI Processing] Skipping Pinecone: No embedding generated');
    return;
  }

  console.log(`[AI Processing] Upserting to Pinecone: ${embeddingId} (Dimensions: ${embedding.length})`);
  
  await index.upsert({
    records: [
      {
        id: embeddingId,
        values: embedding,
        metadata: { 
          itemId, 
          title, 
          type: 'item',
          createdAt: new Date().toISOString()
        },
      },
    ]
  });

  await Item.findByIdAndUpdate(itemId, {
    tags,
    summary,
    embeddingId,
  });
}
