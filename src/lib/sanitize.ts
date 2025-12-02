import DOMPurify from "dompurify";

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - User-provided string
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export const sanitizeInput = (
  input: string,
  maxLength: number = 255
): string => {
  if (!input) return "";

  // Remove all HTML tags and scripts
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Trim whitespace
  const trimmed = clean.trim();

  // Enforce length limit
  return trimmed.slice(0, maxLength);
};

/**
 * Sanitize filename to prevent path traversal
 * @param filename - Original filename
 * @returns Safe filename
 */
export const sanitizeFileName = (filename: string): string => {
  // Remove path traversal attempts and special characters
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  return safe.slice(0, 100);
};

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns true if valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize and validate YouTube URL
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!isValidUrl(url)) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

/**
 * Sanitize and validate Spotify URL
 * @param url - Spotify URL
 * @returns Track ID or null
 */
export const extractSpotifyId = (url: string): string | null => {
  if (!isValidUrl(url)) return null;

  const pattern = /spotify\.com\/track\/([a-zA-Z0-9]{22})/;
  const match = url.match(pattern);

  return match ? match[1] : null;
};

/**
 * Sanitize and validate SoundCloud URL
 * @param url - SoundCloud URL
 * @returns true if valid
 */
export const isValidSoundCloudUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  return url.includes("soundcloud.com/");
};
