import { NextRequest, NextResponse } from 'next/server';
import { getUrlMetadata } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const metadata = await getUrlMetadata(url);

    if (!metadata.title) {
      return NextResponse.json({ error: 'Could not extract metadata' }, { status: 404 });
    }

    return NextResponse.json({
      title: metadata.title,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      type: metadata.type,
      author: metadata.author,
      source: metadata.source,
      siteName: metadata.siteName,
      favicon: metadata.favicon,
      publishedDate: metadata.publishedDate,
      hashtags: metadata.hashtags,
      socialLinks: metadata.socialLinks,
      wordCount: metadata.wordCount,
      locale: metadata.locale,
    });
  } catch (error: any) {
    console.error('API Preview Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata', details: error.message }, { status: 500 });
  }
}
