# Twilio - Voice/Audio APIs

## Visión General

Twilio es la plataforma líder en comunicaciones cloud. Sus APIs de voz conectan apps con la red telefónica tradicional (PSTN) y proporcionan capacidades avanzadas de audio.

## Productos de Audio

### Programmable Voice
- Llamadas telefónicas programáticas
- IVR (Interactive Voice Response)
- Call recording y transcription
- Conferencing
- SIP trunking

### Voice SDK
- VoIP nativo en apps
- Llamadas app-to-app
- Llamadas app-to-phone
- Low latency audio

### Twilio Media Streams
- Acceso a audio en tiempo real
- Bidireccional (in/out)
- WebSocket streaming
- Para AI/ML processing

## API Básica

### Hacer una Llamada
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

// Llamada saliente
const call = await client.calls.create({
  to: '+15017122661',
  from: '+15558675310',
  url: 'http://demo.twilio.com/docs/voice.xml'  // TwiML
});

console.log(call.sid);
```

### TwiML (Twilio Markup Language)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Welcome to our service.</Say>
  <Play>https://api.example.com/audio/welcome.mp3</Play>
  <Gather input="speech dtmf" timeout="3" numDigits="1">
    <Say>Press 1 for sales, 2 for support.</Say>
  </Gather>
</Response>
```

### Responder Llamadas (Flask)
```python
from flask import Flask
from twilio.twiml.voice_response import VoiceResponse

app = Flask(__name__)

@app.route("/answer", methods=['GET', 'POST'])
def answer_call():
    resp = VoiceResponse()
    resp.say("Twilio's always there when you call!")
    return str(resp)
```

## Media Streams

### Configurar Stream Bidireccional
```xml
<Response>
  <Start>
    <Stream url="wss://your-server.com/audio-stream" />
  </Start>
  <Say>Speak now and I'll process your audio.</Say>
</Response>
```

### Recibir Audio (WebSocket)
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Twilio stream connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch(message.event) {
      case 'connected':
        console.log('Stream connected');
        break;
        
      case 'start':
        console.log('Stream started:', message.streamSid);
        break;
        
      case 'media':
        // Audio data (mulaw 8kHz base64)
        const audioPayload = message.media.payload;
        processAudio(Buffer.from(audioPayload, 'base64'));
        break;
        
      case 'stop':
        console.log('Stream stopped');
        break;
    }
  });
});
```

### Enviar Audio de Vuelta
```javascript
// Convertir audio a mulaw 8kHz base64
const audioBase64 = convertToMulaw(audioBuffer).toString('base64');

// Enviar al stream
ws.send(JSON.stringify({
  event: 'media',
  streamSid: streamSid,
  media: {
    payload: audioBase64
  }
}));
```

## Voice Insights

### Métricas Disponibles
```javascript
// Obtener métricas de llamada
const metrics = await client.insights.calls(callSid)
  .metrics
  .list();

// Métricas incluyen:
// - Jitter
// - Packet loss
// - Latency (RTT)
// - MOS (Mean Opinion Score)
// - Codec info
```

### Call Summary
```javascript
const summary = await client.insights.calls(callSid)
  .summary()
  .fetch();

console.log(summary.callType);
console.log(summary.duration);
console.log(summary.qualityIssues);
```

## Conferencias

### Crear Conferencia
```xml
<Response>
  <Dial>
    <Conference 
      startConferenceOnEnter="true"
      endConferenceOnExit="false"
      waitUrl="http://example.com/hold-music.xml"
      record="record-from-start"
      eventCallbackUrl="http://example.com/conference-events"
    >
      room-123
    </Conference>
  </Dial>
</Response>
```

### Controlar Participantes
```javascript
// Mutear participante
await client.conferences('CFXX')
  .participants('CAXX')
  .update({ muted: true });

// Kick participante
await client.conferences('CFXX')
  .participants('CAXX')
  .remove();

// Obtener lista de participantes
const participants = await client.conferences('CFXX')
  .participants
  .list();
```

## Recording

### Grabar Llamadas
```xml
<Response>
  <Record 
    transcribe="true"
    maxLength="300"
    action="/handle-recording"
    recordingStatusCallback="/recording-events"
  />
</Response>
```

### Acceder Grabaciones
```javascript
// Listar grabaciones
const recordings = await client.recordings.list({ limit: 20 });

// Obtener grabación específica
const recording = await client.recordings('REXX').fetch();
console.log(recording.mediaUrl);  // URL del audio

// Descargar
const audioUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
```

## Transcripción

### Real-time Transcription (con Media Streams)
```javascript
// Enviar audio a servicio de transcripción
const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient();

// Configurar stream de Google
const recognizeStream = speechClient
  .streamingRecognize({
    config: {
      encoding: 'MULAW',
      sampleRateHertz: 8000,
      languageCode: 'en-US',
    },
    interimResults: true,
  })
  .on('data', (data) => {
    console.log('Transcript:', data.results[0].alternatives[0].transcript);
  });

// En el handler de Twilio Media Streams
function processAudio(audioBuffer) {
  recognizeStream.write(audioBuffer);
}
```

## Propuestas para WhatsSound

### Implementar (Si necesitamos PSTN)
1. **Dial-in para Audio Rooms**:
   ```typescript
   // Permitir que usuarios llamen por teléfono a una room
   class PhoneDialIn {
     async createDialInNumber(roomId: string): Promise<string> {
       // Comprar/asignar número
       const number = await this.twilioClient.incomingPhoneNumbers.create({
         phoneNumber: '+1...',
         voiceUrl: `${BASE_URL}/rooms/${roomId}/phone-join`
       });
       return number.phoneNumber;
     }
     
     // Webhook cuando alguien llama
     handleIncomingCall(roomId: string): TwiMLResponse {
       const response = new VoiceResponse();
       
       // Conectar a la conferencia/room
       const dial = response.dial();
       dial.conference({
         startConferenceOnEnter: true,
         beep: false,
       }, `whats-room-${roomId}`);
       
       return response;
     }
   }
   ```

2. **Audio Message Delivery**:
   ```typescript
   // Enviar audio messages como llamada
   async function deliverAudioMessage(phoneNumber: string, audioUrl: string): Promise<void> {
     await twilioClient.calls.create({
       to: phoneNumber,
       from: TWILIO_NUMBER,
       twiml: `
         <Response>
           <Say>You have a new audio message.</Say>
           <Play>${audioUrl}</Play>
           <Gather numDigits="1" action="/message-response">
             <Say>Press 1 to reply, 2 to delete.</Say>
           </Gather>
         </Response>
       `
     });
   }
   ```

### Implementar (Alta Prioridad)
3. **Voice Quality Monitoring** (inspirado en Voice Insights):
   ```typescript
   interface CallQualityMetrics {
     jitter: number;        // ms
     packetLoss: number;    // %
     latency: number;       // ms RTT
     mos: number;           // 1-5 Mean Opinion Score
   }
   
   class QualityMonitor {
     calculateMOS(metrics: NetworkMetrics): number {
       // Simplified E-model calculation
       const effectiveLatency = metrics.rtt + metrics.jitter * 2;
       const packetLossFactor = metrics.packetLoss * 2.5;
       
       // R-factor calculation
       let r = 93.2 - effectiveLatency / 40 - packetLossFactor;
       r = Math.max(0, Math.min(100, r));
       
       // Convert to MOS (1-5 scale)
       if (r < 0) return 1;
       if (r > 100) return 4.5;
       return 1 + 0.035 * r + 7e-6 * r * (r - 60) * (100 - r);
     }
     
     getQualityLabel(mos: number): string {
       if (mos >= 4.0) return 'Excellent';
       if (mos >= 3.5) return 'Good';
       if (mos >= 3.0) return 'Fair';
       if (mos >= 2.5) return 'Poor';
       return 'Bad';
     }
   }
   ```

4. **Transcription Service**:
   ```typescript
   class TranscriptionService {
     async transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
       // Usar Whisper, Google Speech, o similar
       const result = await this.whisperService.transcribe(audioUrl, {
         language: 'auto',
         timestamps: true,
       });
       
       return {
         text: result.text,
         segments: result.segments.map(s => ({
           start: s.start,
           end: s.end,
           text: s.text,
           confidence: s.confidence
         })),
         language: result.detected_language
       };
     }
   }
   ```

### Implementar (Media Prioridad)
5. **IVR para Navegación**:
   ```xml
   <!-- Si añadimos phone interface -->
   <Response>
     <Gather input="speech dtmf" timeout="3">
       <Say>Say "rooms" to browse audio rooms, 
            "profile" for your profile,
            or "record" to create a message.</Say>
     </Gather>
   </Response>
   ```

## Pricing Twilio

### Voice
| Feature | Precio |
|---------|--------|
| Llamadas salientes | $0.013/min |
| Llamadas entrantes | $0.0085/min |
| Recording | $0.0025/min |
| Transcription | $0.05/min |
| Conference | $0.0025/min/participant |

### Números
- US local: $1/mes
- Toll-free: $2/mes
- Internacional: varía

## Referencias

- https://www.twilio.com/docs/voice
- TwiML Reference
- Twilio Media Streams
- Voice Insights Dashboard
- Twilio Conference API

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
