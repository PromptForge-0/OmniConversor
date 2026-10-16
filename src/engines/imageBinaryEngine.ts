import { QualitySettings } from '../types/converter';

/**
 * Lê os primeiros N bytes de um Blob/File e retorna uma string hexadecimal formatada
 * acompanhada da representação ASCII para inspeção de cabeçalhos (Magic Bytes).
 */
export async function extractHexHeader(blob: Blob, byteCount: number = 64): Promise<string> {
  const slice = blob.slice(0, Math.min(byteCount, blob.size));
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, '0').toUpperCase();
    hexParts.push(hex);
  }
  return hexParts.join(' ');
}

/**
 * Carrega um Blob de imagem ou Object URL em um elemento HTMLImageElement
 */
export function loadImageElement(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Falha ao decodificar imagem: ' + String(err)));
    img.src = sourceUrl;
  });
}

/**
 * Empacotador Binário Real para arquivos .BMP de 32-bit (ARGB/BGRA)
 * Escreve BITMAPFILEHEADER (14 bytes) + BITMAPINFOHEADER (40 bytes) + Pixel Array BGRA
 */
export async function encodeBmp32Bit(imageElement: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Não foi possível obter contexto 2D do Canvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageElement, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const rgba = imageData.data; // RGBA uint8

  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const pixelArraySize = width * height * 4;
  const totalFileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // 1. BITMAPFILEHEADER (14 bytes)
  // bfType = 'BM' (0x4D42 em Little Endian: 0x42, 0x4D)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4D); // 'M'
  view.setUint32(2, totalFileSize, true); // bfSize (Little Endian)
  view.setUint16(6, 0, true); // bfReserved1
  view.setUint16(8, 0, true); // bfReserved2
  view.setUint32(10, fileHeaderSize + infoHeaderSize, true); // bfOffBits (54 bytes)

  // 2. BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, infoHeaderSize, true); // biSize
  view.setInt32(18, width, true); // biWidth
  view.setInt32(22, height, true); // biHeight (positivo = bottom-up)
  view.setUint16(26, 1, true); // biPlanes
  view.setUint16(28, 32, true); // biBitCount (32 bits por pixel)
  view.setUint32(30, 0, true); // biCompression = BI_RGB (não comprimido)
  view.setUint32(34, pixelArraySize, true); // biSizeImage
  view.setInt32(38, 2835, true); // biXPelsPerMeter (72 DPI ~ 2835 ppm)
  view.setInt32(42, 2835, true); // biYPelsPerMeter
  view.setUint32(46, 0, true); // biClrUsed
  view.setUint32(50, 0, true); // biClrImportant

  // 3. PIXEL ARRAY (BGRA, linha a linha, de baixo para cima)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4;
      const r = rgba[srcIndex];
      const g = rgba[srcIndex + 1];
      const b = rgba[srcIndex + 2];
      const a = rgba[srcIndex + 3];

      // Formato Windows DIB: B, G, R, A
      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
      view.setUint8(offset++, a);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Empacotador Binário Real para arquivos .ICO Multi-Resoluções para Windows
 * Monta ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes por resolução) + sub-imagens PNG embutidas.
 */
export async function encodeIcoMultiResolution(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  resolutions: number[] = [16, 32, 48, 64, 128, 256]
): Promise<Blob> {
  const activeResolutions = resolutions.length > 0 ? resolutions : [16, 32, 48, 64, 128, 256];
  // Ordena de menor para maior para conformidade com o Windows Shell
  const sortedResolutions = [...activeResolutions].sort((a, b) => a - b);

  // Renderiza cada resolução em Canvas e extrai o ArrayBuffer do PNG
  const pngBlobs: { width: number; height: number; buffer: ArrayBuffer }[] = [];

  for (const size of sortedResolutions) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageSource, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    if (blob) {
      const buffer = await blob.arrayBuffer();
      pngBlobs.push({
        width: size,
        height: size,
        buffer,
      });
    }
  }

  const imageCount = pngBlobs.length;
  if (imageCount === 0) {
    throw new Error('Falha ao gerar sub-imagens para o arquivo .ICO');
  }

  const iconDirSize = 6;
  const iconDirEntrySize = 16;
  const headerTotalSize = iconDirSize + imageCount * iconDirEntrySize;

  // Calcula o tamanho total do arquivo
  let totalFileSize = headerTotalSize;
  for (const item of pngBlobs) {
    totalFileSize += item.buffer.byteLength;
  }

  const finalBuffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(finalBuffer);

  // 1. ICONDIR (6 bytes)
  view.setUint16(0, 0, true); // idReserved = 0
  view.setUint16(2, 1, true); // idType = 1 (Ícone .ICO)
  view.setUint16(4, imageCount, true); // idCount

  // 2. ICONDIRENTRY (16 bytes cada) e escrita dos dados
  let currentOffset = headerTotalSize;
  const finalBytes = new Uint8Array(finalBuffer);

  for (let i = 0; i < imageCount; i++) {
    const item = pngBlobs[i];
    const entryOffset = iconDirSize + i * iconDirEntrySize;

    // bWidth e bHeight: 0 representa 256 pixels no padrão .ICO
    const wByte = item.width >= 256 ? 0 : item.width;
    const hByte = item.height >= 256 ? 0 : item.height;

    view.setUint8(entryOffset, wByte); // bWidth
    view.setUint8(entryOffset + 1, hByte); // bHeight
    view.setUint8(entryOffset + 2, 0); // bColorCount (0 se >= 8bpp)
    view.setUint8(entryOffset + 3, 0); // bReserved
    view.setUint16(entryOffset + 4, 1, true); // wPlanes (1)
    view.setUint16(entryOffset + 6, 32, true); // wBitCount (32 bpp com canal Alpha)
    view.setUint32(entryOffset + 8, item.buffer.byteLength, true); // dwBytesInRes
    view.setUint32(entryOffset + 12, currentOffset, true); // dwImageOffset

    // Copia os bytes do PNG para a posição correta
    const subBytes = new Uint8Array(item.buffer);
    finalBytes.set(subBytes, currentOffset);
    currentOffset += item.buffer.byteLength;
  }

  return new Blob([finalBuffer], { type: 'image/x-icon' });
}

/**
 * Converte imagens de forma síncrona/assíncrona para PNG, JPEG, WEBP, BMP ou ICO
 */
export async function convertRasterImage(
  imageElement: HTMLImageElement,
  targetFormat: string,
  settings: QualitySettings
): Promise<Blob> {
  const normFormat = targetFormat.toLowerCase().replace('.', '');
  const width = imageElement.naturalWidth || imageElement.width || 512;
  const height = imageElement.naturalHeight || imageElement.height || 512;

  if (normFormat === 'ico') {
    return encodeIcoMultiResolution(imageElement, settings.icoSizes);
  }

  if (normFormat === 'bmp') {
    return encodeBmp32Bit(imageElement, width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto 2D');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = settings.resampleFilter === 'nearest' ? 'low' : 'high';

  // Se o formato não suporta transparência (ex: JPG) e o usuário desativou canal alfa
  if (normFormat === 'jpg' || normFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(imageElement, 0, 0, width, height);

  let mimeType = 'image/png';
  let qualityArg = settings.lossless ? 1.0 : settings.quality / 100;

  if (normFormat === 'jpg' || normFormat === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (normFormat === 'webp') {
    mimeType = 'image/webp';
  } else if (normFormat === 'svg') {
    // Encapsula como wrapper SVG vetorial de alta definição com embed base64
    const pngDataUrl = canvas.toDataURL('image/png');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" href="${pngDataUrl}" />
</svg>`;
    return new Blob([svgContent], { type: 'image/svg+xml' });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao gerar blob de imagem no formato: ' + targetFormat));
      },
      mimeType,
      qualityArg
    );
  });
}

/**
 * Carrega um arquivo de vídeo em um elemento oculto <video> e captura um quadro real no tempo especificado.
 */
export function captureVideoFrame(
  videoBlobOrUrl: Blob | string,
  targetTimeSeconds: number = 0.5
): Promise<{ frameCanvas: HTMLCanvasElement; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let objectUrl = typeof videoBlobOrUrl === 'string' ? videoBlobOrUrl : URL.createObjectURL(videoBlobOrUrl);
    let isRevocable = typeof videoBlobOrUrl !== 'string';

    video.src = objectUrl;

    const cleanup = () => {
      if (isRevocable) {
        URL.revokeObjectURL(objectUrl);
      }
      video.remove();
    };

    video.onloadedmetadata = () => {
      // Ajusta para um tempo válido dentro da duração
      const seekTime = Math.min(Math.max(0.1, targetTimeSeconds), Math.max(0.1, video.duration - 0.1));
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Falha ao inicializar Canvas para captura de frame de vídeo'));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const duration = video.duration || 0;
        cleanup();
        resolve({ frameCanvas: canvas, width, height, duration });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = (e) => {
      cleanup();
      reject(new Error('Erro ao carregar vídeo para captura de quadros: ' + String(e)));
    };
  });
}
