/**
 * YouTube Data API v3 Utility
 */
export interface YouTubeMetadata {
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  publishedAt: string;
}

export async function getYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined');
    return null;
  }

  // Extract video ID from URL
  const videoIdMatch = url.match(/(?:v=|\/|embed\/|youtu.be\/)([^&?#/]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const snippet = data.items[0].snippet;
    
    return {
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
      tags: snippet.tags || [],
      publishedAt: snippet.publishedAt,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
}
