/**
 * Utility to resolve asset & uploaded image URLs across dev and production.
 * Automatically formats /uploads/... paths to point to the backend server if not proxied,
 * and handles external URLs and fallbacks gracefully.
 */

const BACKEND_URL = (
  import.meta.env?.VITE_BACKEND_URL ||
  (import.meta.env?.PROD ? 'https://backend.vr4web.com' : 'http://localhost:5010')
).replace(/\/$/, '');

/**
 * Checks whether a string is a plausible image path / URL rather than arbitrary text description
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean) return false;

  // Must have a valid protocol or start with / or uploads/
  const hasValidPrefix =
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('/') ||
    clean.startsWith('uploads/') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:');

  const hasImageExtension = /\.(jpg|jpeg|png|webp|svg|gif|avif)($|\?)/i.test(clean);

  // If it contains spaces and neither slashes nor an image extension, it's a descriptive text string, NOT a URL
  if (clean.includes(' ') && !clean.includes('/') && !hasImageExtension) {
    return false;
  }

  return hasValidPrefix || hasImageExtension;
};

export const getImageUrl = (path, fallback = '/case-study/property.png') => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return fallback;
  }

  const clean = path.trim();

  // If not a valid image URL/path (e.g. user typed a sentence description), use fallback
  if (!isValidImageUrl(clean)) {
    return fallback;
  }

  // If already absolute or data/blob URI
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:')
  ) {
    return clean;
  }

  // Handle uploaded assets
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const formatted = clean.startsWith('/') ? clean : `/${clean}`;
    return `${BACKEND_URL}${formatted}`;
  }

  // Regular public assets (e.g. /case-study/property.png)
  return clean.startsWith('/') ? clean : `/${clean}`;
};

export default getImageUrl;
