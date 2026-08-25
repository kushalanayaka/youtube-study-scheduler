export interface YouTubeMetadata {
  videoId: string;
  url: string;
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
}

/**
 * Extracts 11-character YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://music.youtube.com/watch?v=dQw4w9WgXcQ
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
}

/**
 * Normalizes YouTube video URL to standard watch link
 */
export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Keyless metadata fetch using official YouTube oEmbed API
 */
export async function getYouTubeMetadata(url: string, fallbackSubjectTopic?: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const normalizedUrl = buildYouTubeWatchUrl(videoId);

  try {
    const oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
    const res = await fetch(oembedEndpoint, { next: { revalidate: 3600 } });

    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        url: normalizedUrl,
        title: data.title || fallbackSubjectTopic || "YouTube Video",
        authorName: data.author_name || "YouTube Channel",
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch (err) {
    console.warn("oEmbed fetch failed, falling back to default metadata:", err);
  }

  // Graceful fallback if oEmbed is offline or video is private/unlisted
  return {
    videoId,
    url: normalizedUrl,
    title: fallbackSubjectTopic || `YouTube Video (${videoId})`,
    authorName: "YouTube",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}
