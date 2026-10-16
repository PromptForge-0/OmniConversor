import { QualitySettings } from '../types/converter';

export const defaultQualitySettings: QualitySettings = {
  lossless: true,
  quality: 100,
  chromaSubsampling: '4:4:4',
  preserveAlpha: true,
  icoSizes: [16, 32, 48, 64, 128, 256],
  resampleFilter: 'bicubic',
  
  videoCodec: 'libx264',
  crf: 18,
  directStreamCopy: false,
  hardwareAcceleration: 'nvenc',
  frameRate: 'original',
  
  audioSampleRate: 48000,
  audioBitDepth: 16,
  audioChannels: 2,
  audioBitrate: '320k',
  normalizeGain: true,
};
