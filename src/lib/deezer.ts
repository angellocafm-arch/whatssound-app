// ============================================================
// WhatsSound — Deezer API Library
// Maneja búsquedas y obtención de datos de música
// ============================================================

export interface DeezerTrack {
  id: number;
  title: string;
  title_short?: string;
  duration: number; // seconds
  preview: string; // URL del preview de 30s
  artist: {
    id: number;
    name: string;
    picture?: string;
    picture_medium?: string;
    picture_big?: string;
    picture_xl?: string;
  };
  album: {
    id: number;
    title: string;
    cover?: string;
    cover_small?: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
  };
  readable?: boolean;
  explicit_lyrics?: boolean;
}

export interface DeezerArtist {
  id: number;
  name: string;
  picture?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  nb_fan?: number;
  tracklist?: string;
}

export interface DeezerSearchResponse {
  data: DeezerTrack[] | DeezerArtist[];
  total: number;
  next?: string;
}

// Cache in-memory para evitar llamadas repetidas
const cache = new Map<string, any>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCacheKey(endpoint: string, params?: Record<string, string>): string {
  const paramStr = params ? new URLSearchParams(params).toString() : '';
  return `${endpoint}?${paramStr}`;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key) as CacheEntry;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function deezerRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
  const cacheKey = getCacheKey(endpoint, params);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('Deezer cache hit:', cacheKey);
    return cached;
  }

  try {
    // Use our Vercel proxy
    const searchParams = new URLSearchParams(params || {});
    const url = `/api/deezer?${searchParams.toString()}`;
    
    console.log('Deezer API request:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    setCache(cacheKey, data);
    
    return data;
    
  } catch (error) {
    console.error('Deezer request failed:', error);
    
    // Try direct CORS proxy as fallback
    try {
      const directUrl = `https://api.deezer.com/${endpoint}`;
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
      
      console.log('Trying CORS proxy fallback:', corsProxyUrl);
      
      const fallbackResponse = await fetch(corsProxyUrl);
      const fallbackData = await fallbackResponse.json();
      
      setCache(cacheKey, fallbackData);
      return fallbackData;
      
    } catch (fallbackError) {
      console.error('CORS proxy fallback also failed:', fallbackError);
      throw error; // Throw original error
    }
  }
}

/**
 * Buscar tracks en Deezer
 * @param title Título de la canción
 * @param artist Artista (opcional, mejora precisión)
 * @returns Primera coincidencia o null
 */
export async function searchTrack(title: string, artist?: string): Promise<DeezerTrack | null> {
  try {
    let query = title;
    if (artist) {
      query = `artist:"${artist}" track:"${title}"`;
    }
    
    const response = await deezerRequest('', { 
      q: query, 
      type: 'track' 
    }) as DeezerSearchResponse;
    
    if (response.data && response.data.length > 0) {
      return response.data[0] as DeezerTrack;
    }
    
    return null;
  } catch (error) {
    console.error('searchTrack error:', error);
    return null;
  }
}

/**
 * Buscar artista en Deezer
 * @param name Nombre del artista
 * @returns Primera coincidencia o null
 */
export async function searchArtist(name: string): Promise<DeezerArtist | null> {
  try {
    const response = await deezerRequest('', { 
      q: name, 
      type: 'artist' 
    }) as DeezerSearchResponse;
    
    if (response.data && response.data.length > 0) {
      return response.data[0] as DeezerArtist;
    }
    
    return null;
  } catch (error) {
    console.error('searchArtist error:', error);
    return null;
  }
}

/**
 * Obtener track específico por ID
 * @param id Deezer track ID
 * @returns Track data o null
 */
export async function getTrackById(id: number): Promise<DeezerTrack | null> {
  try {
    const track = await deezerRequest('', { id: id.toString() });
    
    // Verificar que es un track válido
    if (track && track.id && track.title && track.artist) {
      return track as DeezerTrack;
    }
    
    return null;
  } catch (error) {
    console.error('getTrackById error:', error);
    return null;
  }
}

/**
 * Buscar múltiples tracks (para autocompletar)
 * @param query Consulta de búsqueda
 * @param limit Número máximo de resultados (default: 10)
 * @returns Array de tracks
 */
export async function searchTracks(query: string, limit: number = 10): Promise<DeezerTrack[]> {
  try {
    const response = await deezerRequest('', { 
      q: query, 
      type: 'track',
      limit: limit.toString()
    }) as DeezerSearchResponse;
    
    return (response.data as DeezerTrack[]) || [];
  } catch (error) {
    console.error('searchTracks error:', error);
    return [];
  }
}

/**
 * Obtener la mejor URL de carátula según el tamaño deseado
 * @param album Album data from Deezer
 * @param size Tamaño deseado: 'small' | 'medium' | 'big' | 'xl'
 * @returns URL de la carátula o fallback
 */
export function getAlbumCoverUrl(album: DeezerTrack['album'], size: 'small' | 'medium' | 'big' | 'xl' = 'medium'): string {
  switch (size) {
    case 'small':
      return album.cover_small || album.cover_medium || album.cover || '';
    case 'medium':
      return album.cover_medium || album.cover_big || album.cover || '';
    case 'big':
      return album.cover_big || album.cover_xl || album.cover_medium || '';
    case 'xl':
      return album.cover_xl || album.cover_big || album.cover_medium || '';
    default:
      return album.cover_medium || album.cover || '';
  }
}

/**
 * Obtener URL de imagen de artista
 * @param artist Artist data from Deezer
 * @param size Tamaño deseado
 * @returns URL de la imagen del artista
 */
export function getArtistImageUrl(artist: DeezerArtist, size: 'medium' | 'big' | 'xl' = 'medium'): string {
  switch (size) {
    case 'medium':
      return artist.picture_medium || artist.picture_big || artist.picture || '';
    case 'big':
      return artist.picture_big || artist.picture_xl || artist.picture_medium || '';
    case 'xl':
      return artist.picture_xl || artist.picture_big || artist.picture_medium || '';
    default:
      return artist.picture_medium || artist.picture || '';
  }
}

/**
 * Formatear duración de segundos a MM:SS
 * @param seconds Duración en segundos
 * @returns Duración formateada "3:45"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Limpiar cache (útil para desarrollo)
 */
export function clearCache(): void {
  cache.clear();
  console.log('Deezer cache cleared');
}