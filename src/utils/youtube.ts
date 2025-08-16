/**
 * YouTube URL parsing and validation utilities
 */

export interface YouTubeVideoInfo {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
  originalUrl: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Remove whitespace
  url = url.trim();
  
  // Various YouTube URL patterns
  const patterns = [
    // Standard YouTube URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    // YouTube share URLs (youtu.be)
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    // YouTube embed URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    // YouTube shorts
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
    // Just the video ID
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Get YouTube video information from URL
 */
export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    originalUrl: url
  };
}

/**
 * Generate YouTube embed HTML
 */
export function getYouTubeEmbedCode(videoId: string, width: number = 560, height: number = 315): string {
  return `<iframe 
    width="${width}" 
    height="${height}" 
    src="https://www.youtube.com/embed/${videoId}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen>
  </iframe>`;
}




