# Web Audio API (MDN) - Browser Audio

## Visión General

La Web Audio API es el estándar W3C para procesamiento de audio en navegadores. Proporciona control de bajo nivel sobre audio con alta precisión y baja latencia.

## Arquitectura del API

### Audio Graph
```
Source Nodes → Processing Nodes → Destination Node
     ↓              ↓                   ↓
OscillatorNode  GainNode         AudioDestination
AudioBuffer     BiquadFilter     (speakers/headphones)
MediaElement    ConvolverNode
MediaStream     DelayNode
```

### Contexto de Audio
```javascript
// Crear contexto
const audioContext = new AudioContext();

// Propiedades importantes
audioContext.sampleRate;      // 44100 o 48000 Hz típico
audioContext.currentTime;     // Tiempo de alta precisión
audioContext.destination;     // Output node
audioContext.state;           // 'suspended', 'running', 'closed'

// Resumir después de user gesture (requerido)
button.onclick = () => audioContext.resume();
```

## Nodos Principales

### Source Nodes (Fuentes)
```javascript
// 1. AudioBufferSourceNode - Audio precargado
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;  // AudioBuffer cargado
source.loop = true;
source.playbackRate.value = 1.0;
source.start(0);  // Empezar inmediatamente

// 2. OscillatorNode - Generador de ondas
const osc = audioContext.createOscillator();
osc.type = 'sine';  // 'sine', 'square', 'sawtooth', 'triangle'
osc.frequency.value = 440;  // Hz
osc.start();

// 3. MediaElementAudioSourceNode - Desde <audio>/<video>
const audio = document.querySelector('audio');
const source = audioContext.createMediaElementSource(audio);

// 4. MediaStreamAudioSourceNode - Desde micrófono
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const source = audioContext.createMediaStreamSource(stream);
```

### Processing Nodes (Efectos)
```javascript
// GainNode - Control de volumen
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.5;  // 50% volume
gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 2);

// BiquadFilterNode - Filtro/EQ
const filter = audioContext.createBiquadFilter();
filter.type = 'lowpass';  // 'highpass', 'bandpass', 'notch', etc.
filter.frequency.value = 1000;
filter.Q.value = 1;

// ConvolverNode - Reverb
const convolver = audioContext.createConvolver();
convolver.buffer = impulseResponseBuffer;

// DelayNode
const delay = audioContext.createDelay(5.0);  // max 5 segundos
delay.delayTime.value = 0.5;

// DynamicsCompressorNode
const compressor = audioContext.createDynamicsCompressor();
compressor.threshold.value = -24;
compressor.ratio.value = 12;
```

### Analysis Nodes
```javascript
// AnalyserNode - Para visualización
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);  // Espectro
analyser.getByteTimeDomainData(dataArray); // Waveform
```

## Timing y Scheduling

### Precisión de Tiempo
```javascript
// currentTime es de alta precisión
const now = audioContext.currentTime;

// Scheduling preciso
source.start(now + 1.0);  // Empezar en 1 segundo
source.stop(now + 5.0);   // Parar en 5 segundos

// AudioParam automation
gainNode.gain.setValueAtTime(0, now);
gainNode.gain.linearRampToValueAtTime(1, now + 0.1);  // Fade in
gainNode.gain.setValueAtTime(1, now + 4.9);
gainNode.gain.linearRampToValueAtTime(0, now + 5);    // Fade out
```

### Métodos de AudioParam
```javascript
param.setValueAtTime(value, time);
param.linearRampToValueAtTime(value, endTime);
param.exponentialRampToValueAtTime(value, endTime);
param.setTargetAtTime(target, startTime, timeConstant);
param.setValueCurveAtTime(values, startTime, duration);
param.cancelScheduledValues(startTime);
```

## Latencia

### Tipos de Latencia
```javascript
// Base latency (fijo del sistema)
audioContext.baseLatency;  // ~0.01s típico

// Output latency
audioContext.outputLatency;  // ~0.02s típico

// Total latency
const totalLatency = audioContext.baseLatency + audioContext.outputLatency;
```

### AudioContext Options
```javascript
// Optimizar para latencia
const ctx = new AudioContext({
  latencyHint: 'interactive',  // Baja latencia
  // 'balanced', 'playback' (alta calidad), número en segundos
  sampleRate: 48000
});
```

## Audio Worklets (Procesamiento Custom)

### Definir Processor
```javascript
// audio-processor.js
class MyProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (e) => {
      // Recibir mensajes del main thread
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      for (let i = 0; i < outputChannel.length; i++) {
        // Custom processing
        outputChannel[i] = inputChannel[i] * 0.5;
      }
    }
    
    return true;  // Keep processor alive
  }
}

registerProcessor('my-processor', MyProcessor);
```

### Usar Processor
```javascript
// En main thread
await audioContext.audioWorklet.addModule('audio-processor.js');

const myNode = new AudioWorkletNode(audioContext, 'my-processor');
source.connect(myNode).connect(audioContext.destination);
```

## Propuestas para WhatsSound

### Implementar (Crítico)
1. **Audio Pipeline Básico**:
   ```typescript
   class AudioPipeline {
     private context: AudioContext;
     private source: AudioBufferSourceNode | null = null;
     private gainNode: GainNode;
     private analyser: AnalyserNode;
     
     constructor() {
       this.context = new AudioContext({ latencyHint: 'interactive' });
       this.gainNode = this.context.createGain();
       this.analyser = this.context.createAnalyser();
       
       this.gainNode.connect(this.analyser);
       this.analyser.connect(this.context.destination);
     }
     
     async loadAndPlay(url: string): Promise<void> {
       const response = await fetch(url);
       const arrayBuffer = await response.arrayBuffer();
       const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
       
       this.source = this.context.createBufferSource();
       this.source.buffer = audioBuffer;
       this.source.connect(this.gainNode);
       this.source.start();
     }
     
     setVolume(value: number): void {
       this.gainNode.gain.setTargetAtTime(value, this.context.currentTime, 0.1);
     }
     
     getVisualizationData(): Uint8Array {
       const data = new Uint8Array(this.analyser.frequencyBinCount);
       this.analyser.getByteFrequencyData(data);
       return data;
     }
   }
   ```

2. **Visualización de Audio**:
   ```typescript
   function drawSpectrum(canvas: HTMLCanvasElement, data: Uint8Array) {
     const ctx = canvas.getContext('2d')!;
     const width = canvas.width;
     const height = canvas.height;
     const barWidth = width / data.length;
     
     ctx.fillStyle = '#1a1a2e';
     ctx.fillRect(0, 0, width, height);
     
     ctx.fillStyle = '#00d4ff';
     for (let i = 0; i < data.length; i++) {
       const barHeight = (data[i] / 255) * height;
       ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
     }
   }
   ```

3. **Resume on User Gesture**:
   ```typescript
   class AudioManager {
     private context: AudioContext;
     private initialized = false;
     
     async initialize(): Promise<void> {
       if (this.initialized) return;
       
       if (this.context.state === 'suspended') {
         await this.context.resume();
       }
       this.initialized = true;
     }
   }
   
   // En UI
   <button onClick={() => audioManager.initialize().then(() => play())}>
     Play
   </button>
   ```

### Implementar (Alta Prioridad)
4. **Crossfade entre Tracks**:
   ```typescript
   async crossfade(fromSource: AudioSource, toSource: AudioSource, duration = 3) {
     const now = this.context.currentTime;
     
     // Fade out current
     fromSource.gainNode.gain.setValueAtTime(1, now);
     fromSource.gainNode.gain.linearRampToValueAtTime(0, now + duration);
     
     // Fade in new
     toSource.gainNode.gain.setValueAtTime(0, now);
     toSource.gainNode.gain.linearRampToValueAtTime(1, now + duration);
     toSource.start();
     
     // Cleanup
     setTimeout(() => fromSource.stop(), duration * 1000);
   }
   ```

5. **EQ Básico**:
   ```typescript
   class EQNode {
     private filters: BiquadFilterNode[];
     
     constructor(context: AudioContext) {
       const frequencies = [60, 250, 1000, 4000, 16000];
       this.filters = frequencies.map(freq => {
         const filter = context.createBiquadFilter();
         filter.type = 'peaking';
         filter.frequency.value = freq;
         filter.Q.value = 1;
         filter.gain.value = 0;
         return filter;
       });
       
       // Chain filters
       for (let i = 0; i < this.filters.length - 1; i++) {
         this.filters[i].connect(this.filters[i + 1]);
       }
     }
     
     setBand(index: number, gain: number) {
       this.filters[index].gain.value = gain; // -12 to +12 dB
     }
   }
   ```

### Implementar (Media Prioridad)
6. **Voice Activity Detection**:
   ```typescript
   class VAD {
     private analyser: AnalyserNode;
     private threshold = -50; // dB
     
     isActive(): boolean {
       const data = new Float32Array(this.analyser.fftSize);
       this.analyser.getFloatTimeDomainData(data);
       
       // Calculate RMS
       let sum = 0;
       for (const sample of data) {
         sum += sample * sample;
       }
       const rms = Math.sqrt(sum / data.length);
       const dB = 20 * Math.log10(rms);
       
       return dB > this.threshold;
     }
   }
   ```

## Compatibilidad

### Browser Support
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| AudioContext | ✓ | ✓ | ✓ | ✓ |
| AudioWorklet | ✓ | ✓ | ✓ | ✓ |
| MediaRecorder | ✓ | ✓ | ✓* | ✓ |

### Polyfills
- standardized-audio-context (Safari quirks)
- audio-recorder-polyfill (MediaRecorder)

## Referencias

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- W3C Web Audio API Specification
- Web Audio API Best Practices
- Audio Worklet Examples (Google Chrome Labs)

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
