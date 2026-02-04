# Deezer API Team - Music Metadata

## Visión General

Deezer es un servicio de streaming musical con foco en metadata rica y algoritmos de recomendación. Su API es referencia para acceso a catálogo musical.

## Tecnología de Audio

### Calidades de Streaming
| Calidad | Bitrate | Formato | Disponibilidad |
|---------|---------|---------|----------------|
| Standard | 128 kbps | MP3 | Free |
| HQ | 320 kbps | MP3 | Premium |
| Lossless | 1411 kbps | FLAC | HiFi |
| 360 Reality | Spatial | Various | Premium |

### Flow Algorithm
- Recomendación personalizada
- Basada en listening history
- Mix de favoritos + descubrimiento
- Actualización en tiempo real

## API de Metadata

### Estructura de Datos
```json
{
  "track": {
    "id": 123456,
    "title": "Song Name",
    "duration": 180,
    "preview": "https://cdn.../preview.mp3",
    "artist": {
      "id": 789,
      "name": "Artist Name",
      "picture_medium": "https://..."
    },
    "album": {
      "id": 456,
      "title": "Album Name",
      "cover_medium": "https://...",
      "release_date": "2024-01-15"
    },
    "bpm": 120,
    "gain": -5.4,
    "contributors": [...]
  }
}
```

### Endpoints Principales
```
GET /track/{id}           - Track details
GET /album/{id}           - Album info + tracks
GET /artist/{id}          - Artist profile
GET /search?q=            - Search all content
GET /user/me/flow         - Personalized flow
GET /chart                - Top tracks/albums
GET /genre                - Browse by genre
```

### Preview Streaming
- 30 segundos de preview gratuito
- URL firmada con expiración
- Sin autenticación requerida
- 128 kbps MP3

## Audio Features

### Metadata Extendida
```json
{
  "track_analysis": {
    "bpm": 128,
    "key": "C Major",
    "loudness": -8.5,
    "energy": 0.85,
    "danceability": 0.72,
    "speechiness": 0.05,
    "acousticness": 0.15,
    "instrumentalness": 0.01,
    "liveness": 0.12,
    "valence": 0.65
  }
}
```

### Lyrics Integration
- Sincronizadas con timestamps
- Múltiples idiomas
- Partnership con Musixmatch
- Karaoke mode support

## Características Únicas

### Deezer Connect
- Multi-room audio
- Chromecast support
- Speaker handoff
- Group listening sessions

### SongCatcher
- Identificación de canciones
- Similar a Shazam
- API de fingerprinting
- Integration con app

### Content Catalog
- 120+ millones de tracks
- Podcasts
- Audiobooks
- Live radio

## Propuestas para WhatsSound

### Implementar (Alta Prioridad)
1. **Rich Metadata Schema**:
   ```typescript
   interface TrackMetadata {
     id: string;
     title: string;
     duration: number;
     
     // Audio features
     bpm?: number;
     key?: string;
     energy?: number;
     mood?: string[];
     
     // Attribution
     artist: ArtistInfo;
     album?: AlbumInfo;
     contributors?: ContributorInfo[];
     
     // Media
     coverArt: {
       small: string;
       medium: string;
       large: string;
     };
     waveform?: number[];
     
     // Social
     playCount?: number;
     likeCount?: number;
     commentCount?: number;
   }
   ```

2. **Search API**:
   ```typescript
   interface SearchOptions {
     query: string;
     type: 'track' | 'artist' | 'album' | 'playlist' | 'user';
     limit?: number;
     offset?: number;
     filters?: {
       genre?: string;
       mood?: string;
       duration?: { min?: number; max?: number };
       bpm?: { min?: number; max?: number };
     };
   }
   
   async function search(options: SearchOptions): Promise<SearchResults> {
     // Full-text search con Elasticsearch/Meilisearch
     // Filtros facetados
     // Relevance scoring
   }
   ```

3. **Audio Analysis Pipeline**:
   ```typescript
   // En upload, analizar:
   async function analyzeAudio(audioFile: Buffer): Promise<AudioFeatures> {
     const features = await audioAnalyzer.analyze(audioFile);
     return {
       bpm: features.bpm,
       key: features.key,
       loudness: features.loudness,
       duration: features.duration,
       // Usar essentia.js o similar
     };
   }
   ```

### Implementar (Media Prioridad)
4. **Preview Generation**:
   - Extraer 30s más representativos
   - Detectar "drop" o chorus
   - Fade in/out suave
   - Almacenar por separado

5. **Lyrics Support**:
   - Formato LRC para sync
   - Editor para usuarios
   - Display durante playback
   - Karaoke mode

### Implementar (Baja Prioridad)
6. **Audio Fingerprinting**:
   - Identificar contenido duplicado
   - Copyright detection
   - Similar song matching
   - Chromaprint/Acoustid integration

### Código de Ejemplo (Metadata Service)
```typescript
class MetadataService {
  private cache: LRUCache<string, TrackMetadata>;
  private db: Database;
  private searchIndex: SearchEngine;
  
  async getTrack(trackId: string): Promise<TrackMetadata> {
    // Check cache first
    const cached = this.cache.get(trackId);
    if (cached) return cached;
    
    // Fetch from DB
    const track = await this.db.tracks.findById(trackId);
    if (!track) throw new NotFoundError('Track not found');
    
    // Enrich with related data
    const enriched = await this.enrichMetadata(track);
    
    // Cache and return
    this.cache.set(trackId, enriched);
    return enriched;
  }
  
  async enrichMetadata(track: Track): Promise<TrackMetadata> {
    const [artist, album, stats] = await Promise.all([
      this.db.artists.findById(track.artistId),
      track.albumId ? this.db.albums.findById(track.albumId) : null,
      this.getTrackStats(track.id)
    ]);
    
    return {
      ...track,
      artist,
      album,
      playCount: stats.plays,
      likeCount: stats.likes,
      commentCount: stats.comments
    };
  }
  
  async search(query: string, options: SearchOptions): Promise<SearchResults> {
    const results = await this.searchIndex.search({
      index: options.type,
      query: query,
      filters: options.filters,
      limit: options.limit || 20,
      offset: options.offset || 0
    });
    
    // Fetch full metadata for results
    const enrichedResults = await Promise.all(
      results.hits.map(hit => this.getTrack(hit.id))
    );
    
    return {
      items: enrichedResults,
      total: results.total,
      hasMore: results.total > (options.offset || 0) + enrichedResults.length
    };
  }
}
```

## API Design Lessons

### Best Practices de Deezer
1. **Paginación consistente**: limit/offset en todos los endpoints
2. **Expansión de campos**: ?fields=id,title,artist.name
3. **Previews sin auth**: Lower barrier to entry
4. **Versionado claro**: /v1/, /v2/
5. **Rate limiting generoso**: Para desarrolladores

### Errores a Evitar
- No devolver metadata parcial sin indicar
- Evitar cambios breaking en respuestas
- Cachear respuestas donde sea posible
- Documentar claramente los límites

## Referencias

- https://developers.deezer.com/api
- Deezer Open API Specification
- Flow Algorithm Patent/Documentation
- Music Metadata Standards (MusicBrainz, Discogs)

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
