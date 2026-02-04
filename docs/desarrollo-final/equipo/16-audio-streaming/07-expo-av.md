# Expo AV Team - React Native Audio

## Visión General

Expo AV (ahora migrado a expo-audio y expo-video) proporciona APIs unificadas para audio/video en React Native. Es la solución más popular para apps móviles multiplataforma.

## Estado Actual

> ⚠️ **IMPORTANTE**: `expo-av` está deprecated desde SDK 54. Usar:
> - `expo-audio` para reproducción y grabación de audio
> - `expo-video` para video

## Expo Audio API

### Instalación
```bash
npx expo install expo-audio
```

### Configuración
```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        }
      ]
    ]
  }
}
```

### Playback con Hooks
```typescript
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

function Player() {
  const player = useAudioPlayer(require('./sound.mp3'));
  const status = useAudioPlayerStatus(player);
  
  return (
    <View>
      <Text>Playing: {status.playing ? 'Yes' : 'No'}</Text>
      <Text>Position: {status.currentTime}s / {status.duration}s</Text>
      <Button title="Play" onPress={() => player.play()} />
      <Button title="Pause" onPress={() => player.pause()} />
      <Button title="Seek" onPress={() => player.seekTo(30)} />
    </View>
  );
}
```

### Opciones de AudioPlayer
```typescript
const player = useAudioPlayer('https://example.com/audio.mp3', {
  updateInterval: 1000,      // Status update frequency
  downloadFirst: true,        // Download before playing
});

// Propiedades del player
player.playing;      // boolean
player.currentTime;  // seconds
player.duration;     // seconds
player.volume;       // 0-1
player.muted;        // boolean
player.loop;         // boolean
player.isBuffering;  // boolean
player.isLoaded;     // boolean
```

## Recording API

### Permisos
```typescript
import { AudioModule, setAudioModeAsync } from 'expo-audio';

async function requestPermissions() {
  const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission denied');
    return;
  }
  
  // Configure audio mode for recording
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
  });
}
```

### Recording con Hooks
```typescript
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';

function Recorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  
  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
  };
  
  const stopRecording = async () => {
    await recorder.stop();
    console.log('Recording saved to:', recorder.uri);
  };
  
  return (
    <View>
      <Text>Recording: {state.isRecording ? 'Yes' : 'No'}</Text>
      <Text>Duration: {Math.round(state.durationMillis / 1000)}s</Text>
      <Button 
        title={state.isRecording ? 'Stop' : 'Record'} 
        onPress={state.isRecording ? stopRecording : startRecording} 
      />
    </View>
  );
}
```

### Recording Presets
```typescript
RecordingPresets.HIGH_QUALITY = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

RecordingPresets.LOW_QUALITY = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 64000,
  // ... platform-specific options
};
```

## Audio Mode Configuration

### setAudioModeAsync
```typescript
import { setAudioModeAsync, InterruptionMode } from 'expo-audio';

await setAudioModeAsync({
  // iOS
  playsInSilentMode: true,      // Play when silent switch is on
  allowsRecording: false,        // Enable microphone
  
  // Cross-platform
  shouldPlayInBackground: true,  // Background playback (requires config)
  
  // Interruption handling
  interruptionMode: InterruptionMode.DuckOthers,  // or MixWithOthers, DoNotMix
});
```

### Background Playback (iOS)
```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    }
  }
}
```

## Audio Sampling (Visualización)

### useAudioSampleListener
```typescript
import { useAudioPlayer, useAudioSampleListener } from 'expo-audio';

function AudioVisualizer() {
  const player = useAudioPlayer(require('./music.mp3'));
  const [waveform, setWaveform] = useState<number[]>([]);
  
  useAudioSampleListener(player, (sample) => {
    // sample.channels[0].frames contains waveform data
    setWaveform(Array.from(sample.channels[0].frames));
  });
  
  return (
    <View>
      <WaveformView data={waveform} />
    </View>
  );
}
```

> **Nota**: Audio sampling requiere permiso RECORD_AUDIO en Android.

## Propuestas para WhatsSound

### Implementar (Crítico)
1. **Audio Service Wrapper**:
   ```typescript
   import { 
     createAudioPlayer, 
     AudioPlayer,
     setAudioModeAsync,
     RecordingPresets,
     useAudioRecorder
   } from 'expo-audio';
   
   class WhatsAudioService {
     private player: AudioPlayer | null = null;
     private onStatusChange?: (status: AudioStatus) => void;
     
     async initialize(): Promise<void> {
       await setAudioModeAsync({
         playsInSilentMode: true,
         shouldPlayInBackground: true,
         interruptionMode: InterruptionMode.DuckOthers,
       });
     }
     
     async loadTrack(uri: string): Promise<void> {
       // Release previous player
       this.player?.release();
       
       // Create new player
       this.player = createAudioPlayer(uri, {
         updateInterval: 500,
       });
       
       // Setup status listener
       this.player.addListener('playbackStatusUpdate', (status) => {
         this.onStatusChange?.(status);
       });
     }
     
     play(): void {
       this.player?.play();
     }
     
     pause(): void {
       this.player?.pause();
     }
     
     seekTo(seconds: number): void {
       this.player?.seekTo(seconds);
     }
     
     setVolume(volume: number): void {
       if (this.player) {
         this.player.volume = volume;
       }
     }
     
     release(): void {
       this.player?.release();
       this.player = null;
     }
   }
   ```

2. **Recording Service**:
   ```typescript
   class WhatsRecordingService {
     private recorder: AudioRecorder | null = null;
     
     async startRecording(): Promise<void> {
       // Request permissions
       const { granted } = await AudioModule.requestRecordingPermissionsAsync();
       if (!granted) throw new Error('Permission denied');
       
       // Configure for recording
       await setAudioModeAsync({
         allowsRecording: true,
         playsInSilentMode: true,
       });
       
       // Create and start recorder
       this.recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
       await this.recorder.prepareToRecordAsync();
       this.recorder.record();
     }
     
     async stopRecording(): Promise<string> {
       if (!this.recorder) throw new Error('No active recording');
       
       await this.recorder.stop();
       const uri = this.recorder.uri;
       
       // Reset audio mode
       await setAudioModeAsync({
         allowsRecording: false,
       });
       
       return uri;
     }
     
     getDuration(): number {
       return this.recorder?.currentTime ?? 0;
     }
   }
   ```

### Implementar (Alta Prioridad)
3. **Custom Recording Options**:
   ```typescript
   const WhatsRecordingPreset: RecordingOptions = {
     extension: '.m4a',
     sampleRate: 44100,
     numberOfChannels: 1,  // Mono for voice
     bitRate: 96000,       // Good quality, smaller files
     android: {
       outputFormat: 'mpeg4',
       audioEncoder: 'aac',
     },
     ios: {
       outputFormat: IOSOutputFormat.MPEG4AAC,
       audioQuality: AudioQuality.HIGH,
       linearPCMBitDepth: 16,
     },
     web: {
       mimeType: 'audio/webm',
       bitsPerSecond: 96000,
     },
   };
   ```

4. **Playback Queue**:
   ```typescript
   class PlaybackQueue {
     private tracks: string[] = [];
     private currentIndex = 0;
     private player: AudioPlayer | null = null;
     
     async playNext(): Promise<void> {
       this.currentIndex++;
       if (this.currentIndex >= this.tracks.length) {
         this.currentIndex = 0;
       }
       await this.loadAndPlay(this.tracks[this.currentIndex]);
     }
     
     async playPrevious(): Promise<void> {
       this.currentIndex--;
       if (this.currentIndex < 0) {
         this.currentIndex = this.tracks.length - 1;
       }
       await this.loadAndPlay(this.tracks[this.currentIndex]);
     }
   }
   ```

### Implementar (Media Prioridad)
5. **Audio Focus Management**:
   ```typescript
   // React to interruptions (calls, other apps)
   import { Audio } from 'expo-av';  // Still available for some features
   
   Audio.setOnAudioInterruptionListener(async (interruptionUpdate) => {
     if (interruptionUpdate.type === 'INTERRUPTION_BEGIN') {
       // Pause playback
       await audioService.pause();
     } else if (interruptionUpdate.type === 'INTERRUPTION_ENDED') {
       // Resume if shouldResume
       if (interruptionUpdate.shouldResume) {
         await audioService.play();
       }
     }
   });
   ```

6. **Offline Support**:
   ```typescript
   import * as FileSystem from 'expo-file-system';
   
   async function downloadForOffline(remoteUri: string, trackId: string): Promise<string> {
     const localUri = `${FileSystem.documentDirectory}tracks/${trackId}.m4a`;
     
     const downloadResult = await FileSystem.downloadAsync(remoteUri, localUri);
     
     if (downloadResult.status === 200) {
       return localUri;
     }
     throw new Error('Download failed');
   }
   ```

## Platform-Specific Considerations

### iOS
- Background audio requires UIBackgroundModes
- Silent mode respects playsInSilentMode
- Audio session categories managed automatically
- AirPlay/CarPlay supported

### Android
- Audio focus handled automatically
- Background service for playback
- Bluetooth/headphone events handled
- Various audio encoders supported

### Web
- MediaRecorder API limitations vary by browser
- Consider polyfills (opus-media-recorder)
- HTTPS required for microphone

## Referencias

- https://docs.expo.dev/versions/latest/sdk/audio/
- https://docs.expo.dev/versions/latest/sdk/av/ (legacy)
- Expo Audio Migration Guide
- React Native Audio Best Practices

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
