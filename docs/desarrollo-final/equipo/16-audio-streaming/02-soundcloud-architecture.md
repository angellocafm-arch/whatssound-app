# SoundCloud Architecture - User-Generated Audio

## Visión General

SoundCloud revolucionó el audio user-generated content (UGC). Con más de 300 millones de tracks, su arquitectura maneja upload masivo y streaming escalable.

## Tecnología de Audio

### Upload Pipeline
```
Usuario → Transcode → Validate → Process → Store → CDN
         (normalization, (waveform,   (S3)   (distribute)
          multi-bitrate) metadata)
```

### Formatos Soportados
- **Input**: MP3, WAV, FLAC, AIFF, OGG, ALAC, AAC, WMA
- **Output**: MP3 128kbps, AAC 64/128/256kbps, Opus
- **Waveform**: Pre-calculada para UI rápida

### Procesamiento de Audio
1. **Transcoding**: FFmpeg pipeline optimizado
2. **Normalization**: ReplayGain para consistencia
3. **Waveform generation**: Análisis de amplitud
4. **Metadata extraction**: ID3, Vorbis comments

## API de Streaming

### OAuth 2.1 Authentication
```bash
# Client Credentials (público)
POST /oauth/token
grant_type=client_credentials
Authorization: Basic Base64(client_id:client_secret)

# Authorization Code (usuario)
POST /oauth/token
grant_type=authorization_code
code_verifier=PKCE_CODE
```

### Streaming Endpoints
```javascript
// Obtener stream URL
GET /tracks/{id}/stream
Authorization: Bearer ACCESS_TOKEN

// Response con URL firmada
{
  "http_mp3_128_url": "https://...",
  "hls_mp3_128_url": "https://...",
  "preview_mp3_128_url": "https://..."
}
```

## Latencia y Calidad

### Métricas
- **Upload processing**: 1-5 minutos típico
- **Stream start**: < 500ms con HLS
- **Waveform load**: Instant (pre-cached)
- **Search indexing**: < 1 minuto

### Optimizaciones
- **Chunked upload**: Para archivos grandes
- **Progressive streaming**: No esperar carga completa
- **HLS adaptive**: Múltiples calidades disponibles
- **CDN geográfico**: Akamai/Cloudflare

## Widget Embebido

### Características
```html
<iframe 
  src="https://w.soundcloud.com/player/?url=..."
  allow="autoplay">
</iframe>
```
- Reproductor personalizable
- SDK JavaScript para control
- Visualización de waveform
- Comentarios timestamped

### Widget API
```javascript
const widget = SC.Widget(iframe);
widget.bind(SC.Widget.Events.PLAY, () => {});
widget.bind(SC.Widget.Events.PLAY_PROGRESS, ({currentPosition}) => {});
widget.seekTo(milliseconds);
widget.setVolume(0-100);
```

## Características Únicas

### Timed Comments
- Comentarios vinculados a timestamp específico
- Visualización sobre waveform
- Social engagement en momentos clave

### Waveform Visual
- Pre-generada en backend
- JSON con datos de amplitud
- Canvas rendering en cliente
- Seek visual intuitivo

### Playlists/Sets
- Colecciones ordenadas
- Continous playback
- Shuffle/repeat modes
- Collaborative (owner invite)

## Propuestas para WhatsSound

### Implementar (Alta Prioridad)
1. **Waveform Generation**: Visualización de audio
   - Generar en upload con FFmpeg
   - Almacenar como JSON/binary
   - Render con Canvas/WebGL
   
2. **Timed Comments/Reactions**: Engagement social
   - Reactions vinculadas a timestamps
   - Visualización durante playback
   - "Momentos populares"

3. **Progressive Upload**:
   - Chunked para archivos grandes
   - Feedback de progreso
   - Resume interrupted uploads

### Implementar (Media Prioridad)
4. **Multi-bitrate Transcoding**:
   - Generar múltiples calidades en upload
   - HLS manifest para adaptive streaming
   - Preview/snippet generation

5. **Embeddable Player**:
   - Widget para compartir
   - SDK para integración
   - Personalización de marca

### Código de Ejemplo (Waveform)
```javascript
// Generar waveform con audiowaveform
// Backend: audiowaveform -i audio.mp3 -o waveform.json --pixels-per-second 50

// Frontend: Render con Canvas
function drawWaveform(waveformData, canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width / waveformData.length;
  
  waveformData.forEach((amplitude, i) => {
    const barHeight = amplitude * height;
    ctx.fillRect(i * barWidth, (height - barHeight) / 2, barWidth - 1, barHeight);
  });
}
```

## Rate Limits

| Endpoint | Límite |
|----------|--------|
| Token request | 50/12h app, 30/1h IP |
| API calls | 15,000/día |
| Uploads | Varía por plan |

## Referencias

- https://developers.soundcloud.com/docs/api/guide
- https://github.com/soundcloud/api (issue tracker)
- SoundCloud Widget API Documentation
- Open API Specification (Swagger)

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
