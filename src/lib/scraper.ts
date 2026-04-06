import axios from 'axios';
import * as cheerio from 'cheerio';
import { getYouTubeMetadata } from '@/lib/youtube';

export interface MetadataResult {
  title?: string;
  description?: string;
  thumbnail?: string;
  type?: 'article' | 'video' | 'pdf' | 'tweet' | 'image' | 'note' | 'link';
  tags?: string[];
  author?: string;
  source?: string;
  favicon?: string;
  siteName?: string;
  publishedDate?: string;
  socialLinks?: string[];
  hashtags?: string[];
  locale?: string;
  wordCount?: number;
}

export function detectType(url: string): 'article' | 'video' | 'pdf' | 'tweet' | 'image' | 'note' | 'link' {
  if (!url) return 'note';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'video';
  if (u.includes('twitter.com') || u.includes('x.com') || u.includes('t.co')) return 'tweet';
  if (u.endsWith('.pdf')) return 'pdf';
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  if (u.includes('medium.com') || u.includes('substack.com') || u.includes('wikipedia.org') || u.includes('dev.to') || u.includes('hashnode')) return 'article';
  if (u.includes('github.com')) return 'link';
  if (u.includes('instagram.com') || u.includes('linkedin.com') || u.includes('facebook.com') || u.includes('reddit.com')) return 'link';
  return 'link';
}

function extractSocialLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const socials: string[] = [];
  const socialPatterns = ['twitter.com', 'x.com', 'github.com', 'linkedin.com', 'instagram.com', 'facebook.com', 'youtube.com', 'reddit.com', 'mastodon'];
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && socialPatterns.some(p => href.includes(p)) && !href.includes(baseUrl)) {
      if (!socials.includes(href) && socials.length < 5) {
        socials.push(href);
      }
    }
  });
  return socials;
}

function extractHashtags($: cheerio.CheerioAPI, content: string): string[] {
  const tags: string[] = [];
  
  // From meta keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    keywords.split(',').forEach(k => {
      const t = k.trim().toLowerCase();
      if (t && t.length > 1 && t.length < 30 && !tags.includes(t)) tags.push(t);
    });
  }

  // From article:tag
  $('meta[property="article:tag"]').each((_, el) => {
    const t = $(el).attr('content')?.trim().toLowerCase();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // From hashtags in body text
  const hashRegex = /#([a-zA-Z0-9_]{2,25})/g;
  let match;
  while ((match = hashRegex.exec(content)) !== null) {
    const t = match[1].toLowerCase();
    if (!tags.includes(t) && tags.length < 15) tags.push(t);
  }

  return tags.slice(0, 10);
}

export async function getUrlMetadata(url: string, manualType?: string): Promise<MetadataResult> {
  const type = (manualType as any) || detectType(url);
  const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  const result: MetadataResult = { type, source: parsedUrl.hostname };

  try {
    // YouTube specific
    if (type === 'video' && (url.includes('youtube') || url.includes('youtu.be'))) {
      const ytData = await getYouTubeMetadata(url);
      if (ytData) {
        result.title = ytData.title;
        result.description = ytData.description;
        result.thumbnail = ytData.thumbnail;
        result.tags = ytData.tags;
        result.siteName = 'YouTube';
        result.favicon = 'https://www.youtube.com/favicon.ico';
        return result;
      }
    }

    // Generic scraper
    const { data } = await axios.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }, 
      timeout: 10000,
      maxRedirects: 5,
    });
    
    const $ = cheerio.load(data);
    const bodyText = $('body').text().slice(0, 5000);
    
    // Title — cascade through best sources
    result.title = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="twitter:title"]').attr('content') ||
                   $('title').text().trim();
                   
    // Description
    result.description = $('meta[property="og:description"]').attr('content') || 
                         $('meta[name="twitter:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         $('p').first().text().trim().slice(0, 300);
                         
    // Thumbnail / Image
    result.thumbnail = $('meta[property="og:image"]').attr('content') || 
                       $('meta[name="twitter:image"]').attr('content') ||
                       $('meta[name="twitter:image:src"]').attr('content');
    
    // Fix relative URLs for thumbnail
    if (result.thumbnail && !result.thumbnail.startsWith('http')) {
      result.thumbnail = new URL(result.thumbnail, parsedUrl.origin).href;
    }
                       
    // Author
    result.author = $('meta[name="author"]').attr('content') || 
                    $('meta[property="article:author"]').attr('content') ||
                    $('meta[name="twitter:creator"]').attr('content') ||
                    $('[rel="author"]').first().text().trim() ||
                    $('meta[property="og:site_name"]').attr('content');

    // Site Name
    result.siteName = $('meta[property="og:site_name"]').attr('content') ||
                      $('meta[name="application-name"]').attr('content') ||
                      parsedUrl.hostname.replace('www.', '');

    // Favicon
    result.favicon = $('link[rel="icon"]').attr('href') || 
                     $('link[rel="shortcut icon"]').attr('href') ||
                     $('link[rel="apple-touch-icon"]').attr('href') ||
                     `${parsedUrl.origin}/favicon.ico`;
    
    if (result.favicon && !result.favicon.startsWith('http')) {
      result.favicon = new URL(result.favicon, parsedUrl.origin).href;
    }

    // Published date
    result.publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                           $('meta[name="date"]').attr('content') ||
                           $('time[datetime]').first().attr('datetime') ||
                           $('meta[property="og:updated_time"]').attr('content');

    // Locale
    result.locale = $('meta[property="og:locale"]').attr('content') || 
                    $('html').attr('lang') || undefined;

    // Hashtags / Keywords
    result.hashtags = extractHashtags($, bodyText);

    // Social links
    result.socialLinks = extractSocialLinks($, parsedUrl.hostname);

    // Word count estimate
    const articleText = $('article').text() || $('main').text() || $('body').text();
    result.wordCount = articleText.split(/\s+/).filter(w => w.length > 0).length;

  } catch (error) {
    console.error('Metadata extraction error:', error);
  }

  return result;
}
