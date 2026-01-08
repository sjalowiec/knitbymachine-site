import fs from 'node:fs/promises';
import path from 'node:path';

const CACHE_FILE = path.join(process.cwd(), 'src/data/vimeoThumbCache.json');
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  thumbnail_url: string;
  fetched_at: number;
}

interface CacheData {
  [videoId: string]: CacheEntry;
}

export function extractVimeoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  
  // player.vimeo.com/video/{id}
  const playerMatch = trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) return playerMatch[1];
  
  // vimeo.com/{id} or vimeo.com/video/{id}
  const standardMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (standardMatch) return standardMatch[1];
  
  return null;
}

export function toVimeoPlayerUrl(url: string): string | null {
  const id = extractVimeoId(url);
  if (!id) return null;
  return `https://player.vimeo.com/video/${id}`;
}

async function readCache(): Promise<CacheData> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeCache(cache: CacheData): Promise<void> {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[vimeo] failed to write cache:', err);
  }
}

export async function getVimeoThumbnailUrl(videoUrl: string): Promise<string | null> {
  const id = extractVimeoId(videoUrl);
  if (!id) return null;
  
  // Build sanitized URL from ID only (no query params from original)
  const sanitizedVimeoUrl = `https://vimeo.com/${id}`;
  
  const cache = await readCache();
  const entry = cache[id];
  
  // Check if cache entry exists and is not stale
  if (entry && (Date.now() - entry.fetched_at) < CACHE_TTL_MS) {
    return entry.thumbnail_url;
  }
  
  // Cache miss or stale - fetch from oEmbed using sanitized URL
  let thumbnailUrl: string | null = null;
  
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(sanitizedVimeoUrl)}`;
    const response = await fetch(oembedUrl);
    
    if (response.ok) {
      const data = await response.json();
      thumbnailUrl = data.thumbnail_url || null;
      
      if (thumbnailUrl) {
        console.log('[vimeo] oembed thumbnail fetched for', id);
      }
    } else {
      console.warn('[vimeo] oEmbed request failed:', response.status);
    }
  } catch (err) {
    console.warn('[vimeo] oEmbed fetch error:', err);
  }
  
  // Fallback: Use direct Vimeo CDN URL if oEmbed didn't return a thumbnail
  // This works for videos with domain restrictions where oEmbed fails
  if (!thumbnailUrl) {
    const cdnUrl = `https://i.vimeocdn.com/video/${id}_640x360.jpg`;
    
    try {
      // Verify the CDN URL actually works
      const cdnResponse = await fetch(cdnUrl, { method: 'HEAD' });
      if (cdnResponse.ok && cdnResponse.headers.get('content-type')?.includes('image/jpeg')) {
        thumbnailUrl = cdnUrl;
        console.log('[vimeo] CDN thumbnail found for', id);
      }
    } catch (err) {
      console.warn('[vimeo] CDN thumbnail check failed:', err);
    }
  }
  
  if (!thumbnailUrl) {
    console.error('[vimeo] no thumbnail available for', id);
    return null;
  }
  
  // Update cache
  cache[id] = {
    thumbnail_url: thumbnailUrl,
    fetched_at: Date.now()
  };
  await writeCache(cache);
  
  return thumbnailUrl;
}
