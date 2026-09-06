/**
 * Utility functions for parsing Google Drive video links and building preview / embed URLs
 */

export interface GDriveMetadata {
  fileId: string;
  url: string;
  previewUrl: string;
  title: string;
}

/**
 * Extracts Google Drive file ID from various URL formats:
 * - https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9/view?usp=sharing
 * - https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9/preview
 * - https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9
 * - https://drive.google.com/uc?id=1A2B3C4D5E6F7G8H9
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const cleanedUrl = url.trim();

  // Standard /file/d/ FILE_ID / format
  const fileDMatch = cleanedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileDMatch) return fileDMatch[1];

  // Param format ?id= FILE_ID or &id= FILE_ID
  const paramMatch = cleanedUrl.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (paramMatch) return paramMatch[1];

  return null;
}

/**
 * Checks if a string URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("drive.google.com") || extractGoogleDriveFileId(url) !== null;
}

/**
 * Returns Google Drive preview link for iframe embedding
 */
export function buildGoogleDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Returns standard Google Drive view link for browser/reminder opening
 */
export function buildGoogleDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Unified provider detection helper for YouTube vs Google Drive
 */
export function detectVideoProvider(url: string): {
  provider: "YOUTUBE" | "GDRIVE" | "UNKNOWN";
  videoId: string | null;
  watchUrl: string;
  previewUrl: string;
} {
  const gdriveId = extractGoogleDriveFileId(url);
  if (gdriveId) {
    return {
      provider: "GDRIVE",
      videoId: gdriveId,
      watchUrl: buildGoogleDriveViewUrl(gdriveId),
      previewUrl: buildGoogleDrivePreviewUrl(gdriveId),
    };
  }

  // Check YouTube
  const youtubeMatch = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      provider: "YOUTUBE",
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      previewUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  return {
    provider: "UNKNOWN",
    videoId: null,
    watchUrl: url,
    previewUrl: url,
  };
}
