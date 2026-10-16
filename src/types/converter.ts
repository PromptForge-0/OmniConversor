export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'data' | 'archive';

export type ConversionStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface QualitySettings {
  // Imagem
  lossless: boolean;
  quality: number; // 1-100
  chromaSubsampling: '4:4:4' | '4:2:0';
  preserveAlpha: boolean;
  icoSizes: number[]; // e.g. [16, 32, 48, 64, 128, 256]
  resampleFilter: 'bicubic' | 'bilinear' | 'nearest';
  
  // Vídeo
  videoCodec: 'libx264' | 'libx265' | 'libvpx-vp9' | 'libsvtav1' | 'prores';
  crf: number; // 0 = lossless, 18 = visually lossless, 23 = default
  directStreamCopy: boolean; // -c copy remux
  hardwareAcceleration: 'none' | 'nvenc' | 'amf' | 'qsv';
  frameRate: 'original' | 24 | 30 | 60 | 120;
  
  // Áudio
  audioSampleRate: 44100 | 48000 | 96000 | 192000;
  audioBitDepth: 16 | 24 | 32;
  audioChannels: 1 | 2; // Mono / Stereo
  audioBitrate: '128k' | '192k' | '256k' | '320k' | 'lossless';
  normalizeGain: boolean;
}

export interface QueueItem {
  id: string;
  name: string;
  originalSize: number;
  convertedSize?: number;
  category: FileCategory;
  inputFormat: string;
  targetFormat: string;
  status: ConversionStatus;
  progress: number;
  error?: string;
  originalBlob?: Blob;
  originalUrl?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  mimeType: string;
  createdAt: number;
  executionTimeMs?: number;
  
  // Metadados inspecionados
  width?: number;
  height?: number;
  duration?: number;
  hexHeaderOriginal?: string;
  hexHeaderConverted?: string;
  settings: QualitySettings;
  
  // Ações especiais para vídeo (extração real)
  videoAudioExtracted?: boolean;
  videoCapturedFrameUrl?: string;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  category: FileCategory;
  targetFormat: string;
  settings: Partial<QualitySettings>;
}

export interface FormatDefinition {
  extension: string;
  label: string;
  category: FileCategory;
  mimeType: string;
  isNativeEngine: boolean; // Processável 100% no cliente sem servidor
  description: string;
  magicBytes?: string; // Ex: '89 50 4E 47'
}
