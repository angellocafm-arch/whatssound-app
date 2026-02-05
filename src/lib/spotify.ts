/**
 * WhatsSound — Spotify Web API Client
 * Búsqueda de canciones, metadatos, carátulas, previews
 * 
 * SETUP: Kike debe crear app en https://developer.spotify.com/dashboard
 * y poner EXPO_PUBLIC_SPOTIFY_CLIENT_ID en .env
 */

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '';

let accessToken: string | null = null;
let tokenExpiry = 0;

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  albumArt: string | null;       // URL de la carátula
  albumArtSmall: string | null;  // 64x64
  duration: string;              // "3:12"
  durationMs: number;
  previewUrl: string | null;     // 30s preview (gratis)
  spotifyUri: string;            // Para playback SDK
  popularity: number;            // 0-100
}

/**
 * Get access token using Client Credentials flow (no user login needed)
 * Perfect for search + metadata
 */
async function getToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.warn('[Spotify] No credentials configured. Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET in .env');
    return null;
  }

  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s early
    return accessToken;
  } catch (err) {
    console.error('[Spotify] Token error:', err);
    return null;
  }
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function mapTrack(track: { id: string; name: string; artists?: { name: string }[]; album?: { images?: { url: string }[] }; duration_ms?: number }): SpotifyTrack {
  const images = track.album?.images || [];
  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.map((a: { name: string }) => a.name).join(', ') || 'Desconocido',
    artists: track.artists?.map((a: { name: string }) => a.name) || [],
    album: track.album?.name || '',
    albumArt: images[0]?.url || null,       // 640x640
    albumArtSmall: images[2]?.url || null,   // 64x64
    duration: formatDuration(track.duration_ms),
    durationMs: track.duration_ms,
    previewUrl: track.preview_url,
    spotifyUri: track.uri,
    popularity: track.popularity || 0,
  };
}

/**
 * Search tracks by query
 */
export async function searchTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
  const token = await getToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: String(limit),
      market: 'ES',
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return (data.tracks?.items || []).map(mapTrack);
  } catch (err) {
    console.error('[Spotify] Search error:', err);
    return [];
  }
}

/**
 * Get track by Spotify ID
 */
export async function getTrack(trackId: string): Promise<SpotifyTrack | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}?market=ES`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return mapTrack(data);
  } catch (err) {
    console.error('[Spotify] Get track error:', err);
    return null;
  }
}

/**
 * Check if Spotify is configured
 */
export function isSpotifyConfigured(): boolean {
  return Boolean(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
}
