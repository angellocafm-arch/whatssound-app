/**
 * WhatsSound — Deezer API Client
 * Búsqueda de canciones, carátulas, previews 30s
 * 100% gratis, sin API key, sin registro
 * 
 * Cuando Spotify desbloquee la creación de apps, migrar a spotify.ts
 */

const DEEZER_API = 'https://api.deezer.com';

// CORS proxy for web (Deezer blocks browser requests)
// Use our own Vercel proxy, or fallback to alternatives
const CORS_PROXIES = [
  '/api/deezer?endpoint=raw&url=',      // Our own proxy (same domain)
  'https://corsproxy.io/?',              // Third party fallback
  'https://api.allorigins.win/raw?url=', // Another fallback
];

// Simple proxy: just prepend the proxy URL
function getProxyUrl(url: string): string {
  // On our own domain, use the Vercel serverless function directly
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    // Use our API route which handles the Deezer call server-side
    const params = new URL(url);
    const q = params.searchParams.get('q') || '';
    const limit = params.searchParams.get('limit') || '10';
    if (url.includes('/search?')) {
      return `/api/deezer?q=${encodeURIComponent(q)}&limit=${limit}`;
    }
  }
  // Fallback: try CORS proxy
  return CORS_PROXIES[0] + encodeURIComponent(url);
}

const CORS_PROXY = CORS_PROXIES[1]; // kept for compatibility

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;       // 500x500 cover
  albumArtSmall: string | null;  // 56x56
  duration: string;              // "3:12"
  durationMs: number;
  previewUrl: string | null;     // 30s preview MP3
  source: 'deezer' | 'spotify';
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function mapTrack(track: any): MusicTrack {
  return {
    id: `deezer-${track.id}`,
    name: track.title_short || track.title,
    artist: track.artist?.name || 'Desconocido',
    album: track.album?.title || '',
    albumArt: track.album?.cover_big || track.album?.cover_medium || null,
    albumArtSmall: track.album?.cover_small || null,
    duration: formatDuration(track.duration || 0),
    durationMs: (track.duration || 0) * 1000,
    previewUrl: track.preview || null,
    source: 'deezer',
  };
}

/**
 * Search tracks by query
 */
export async function searchTracks(query: string, limit = 10): Promise<MusicTrack[]> {
  try {
    const url = `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    // Use our proxy on web, direct on native
    const fetchUrl = typeof window !== 'undefined' ? getProxyUrl(url) : url;
    
    const response = await fetch(fetchUrl);
    const data = await response.json();
    return (data.data || []).map(mapTrack);
  } catch (err) {
    console.error('[Deezer] Search error:', err);
    return [];
  }
}

/**
 * Get track by Deezer ID
 */
export async function getTrack(trackId: string): Promise<MusicTrack | null> {
  try {
    const id = trackId.replace('deezer-', '');
    const url = `${DEEZER_API}/track/${id}`;
    const fetchUrl = typeof window !== 'undefined' ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
    
    const response = await fetch(fetchUrl);
    const data = await response.json();
    return mapTrack(data);
  } catch (err) {
    console.error('[Deezer] Get track error:', err);
    return null;
  }
}

/**
 * Get top tracks for an artist
 */
export async function getArtistTopTracks(artistName: string, limit = 5): Promise<MusicTrack[]> {
  try {
    // Search artist first
    const url = `${DEEZER_API}/search/artist?q=${encodeURIComponent(artistName)}&limit=1`;
    const fetchUrl = typeof window !== 'undefined' ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
    
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    if (!data.data?.[0]) return [];
    
    const artistId = data.data[0].id;
    const topUrl = `${DEEZER_API}/artist/${artistId}/top?limit=${limit}`;
    const topFetchUrl = typeof window !== 'undefined' ? `${CORS_PROXY}${encodeURIComponent(topUrl)}` : topUrl;
    
    const topResponse = await fetch(topFetchUrl);
    const topData = await topResponse.json();
    return (topData.data || []).map(mapTrack);
  } catch (err) {
    console.error('[Deezer] Artist top tracks error:', err);
    return [];
  }
}
