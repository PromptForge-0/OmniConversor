/**
 * Motor de Áudio Binário Real do OmniConvert Studio Pro
 * Decodificação via Web Audio API e codificação binária RIFF/WAVE PCM 16/24/32-bit pura.
 */

/**
 * Escreve uma string ASCII em uma DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Codifica um AudioBuffer em um arquivo binário autêntico .WAV (RIFF WAVE PCM)
 * Suporta 16-bit PCM Inteiro, 24-bit PCM Inteiro e 32-bit IEEE Float.
 */
export function encodeWavPcm(
  audioBuffer: AudioBuffer,
  bitDepth: 16 | 24 | 32 = 16,
  useFloat: boolean = false
): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // 1. RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize (total size - 8)
  writeString(view, 8, 'WAVE');

  // 2. fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 para PCM)
  const formatCode = useFloat && bitDepth === 32 ? 3 : 1; // 1 = PCM Inteiro, 3 = IEEE Float
  view.setUint16(20, formatCode, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // 3. data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Extrai canais
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  // 4. Intercala amostras (Interleaving) e converte bits
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];

      // Clamp de segurança (-1.0 a 1.0)
      if (sample > 1.0) sample = 1.0;
      else if (sample < -1.0) sample = -1.0;

      if (bitDepth === 16) {
        // 16-bit signed integer (-32768 a 32767)
        const intSample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(offset, Math.floor(intSample), true);
        offset += 2;
      } else if (bitDepth === 24) {
        // 24-bit signed integer (-8388608 a 8388607)
        const intSample = Math.floor(sample < 0 ? sample * 8388608 : sample * 8388607);
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        if (useFloat) {
          view.setFloat32(offset, sample, true);
        } else {
          // 32-bit signed integer
          const intSample = Math.floor(sample < 0 ? sample * 2147483648 : sample * 2147483647);
          view.setInt32(offset, intSample, true);
        }
        offset += 4;
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Decodifica qualquer arquivo de áudio ou vídeo suportado pelo navegador usando AudioContext
 */
export async function decodeAudioSource(audioOrVideoBlob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await audioOrVideoBlob.arrayBuffer();
  // Cria AudioContext temporário para decodificação
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Extrai a trilha sonora de um arquivo de vídeo carregado e produz um arquivo .WAV PCM real
 */
export async function extractAudioFromVideoFile(
  videoBlob: Blob,
  bitDepth: 16 | 24 | 32 = 16
): Promise<{ wavBlob: Blob; duration: number; sampleRate: number; channels: number }> {
  const audioBuffer = await decodeAudioSource(videoBlob);
  const wavBlob = encodeWavPcm(audioBuffer, bitDepth, bitDepth === 32);
  return {
    wavBlob,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

/**
 * Gera proceduralmente um buffer sonoro sintético estereofônico de teste (Acorde harmônico e varredura)
 * Usado para seed data na inicialização do aplicativo
 */
export function generateProceduralAudioBuffer(durationSeconds: number = 2.5, sampleRate: number = 44100): AudioBuffer {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Frequências para acorde maior límpido: C4 (261.63Hz), E4 (329.63Hz), G4 (392.00Hz), C5 (523.25Hz)
  const baseFreqs = [261.63, 329.63, 392.0, 523.25];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope ADSR suave
    const attack = Math.min(1.0, t / 0.1);
    const release = Math.min(1.0, (durationSeconds - t) / 0.4);
    const env = attack * release;

    let sampleL = 0;
    let sampleR = 0;

    for (let f = 0; f < baseFreqs.length; f++) {
      const freq = baseFreqs[f];
      // Variação estéreo suave
      sampleL += Math.sin(2 * Math.PI * freq * t) * (0.2 / baseFreqs.length);
      sampleR += Math.sin(2 * Math.PI * (freq * 1.002) * t) * (0.2 / baseFreqs.length);
    }

    leftChannel[i] = sampleL * env;
    rightChannel[i] = sampleR * env;
  }

  audioCtx.close().catch(() => {});
  return buffer;
}
