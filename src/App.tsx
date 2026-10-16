import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { TitleBarWindows } from './components/TitleBarWindows';
import { BatchQueueManager } from './components/BatchQueueManager';
import { QualityInspectorModal } from './components/QualityInspectorModal';
import { QueueItem, FileCategory, QualitySettings } from './types/converter';
import { defaultQualitySettings } from './utils/seedData';
import {
  loadImageElement,
  convertRasterImage,
  captureVideoFrame,
} from './engines/imageBinaryEngine';
import {
  decodeAudioSource,
  encodeWavPcm,
  extractAudioFromVideoFile,
} from './engines/audioWavEngine';
import { convertDataDocument } from './engines/dataDocumentEngine';

export default function App() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | FileCategory>('all');
  const [settingsModalItem, setSettingsModalItem] = useState<QueueItem | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Adição de Arquivos via Drag-and-Drop, File Picker ou Paste da Área de Transferência
  const handleAddFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newItems: QueueItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let category: FileCategory = 'document';
      let defaultTarget = 'TXT';

      if (['png', 'jpg', 'jpeg', 'webp', 'ico', 'bmp', 'svg', 'gif', 'tiff', 'avif'].includes(ext)) {
        category = 'image';
        defaultTarget = ext === 'png' ? 'ICO' : 'PNG';
      } else if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'wmv'].includes(ext)) {
        category = 'video';
        defaultTarget = 'WAV';
      } else if (['wav', 'mp3', 'flac', 'aac', 'ogg', 'm4a', 'aiff'].includes(ext)) {
        category = 'audio';
        defaultTarget = 'WAV';
      } else if (['json', 'csv', 'tsv', 'sql', 'xml', 'yaml', 'yml'].includes(ext)) {
        category = 'data';
        defaultTarget = ext === 'json' ? 'CSV' : 'JSON';
      } else if (['zip', '7z', 'tar', 'gz', 'rar'].includes(ext)) {
        category = 'archive';
        defaultTarget = 'ZIP';
      }

      const originalUrl = URL.createObjectURL(file);

      newItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        originalSize: file.size,
        category,
        inputFormat: ext ? ext.toUpperCase() : 'IMG',
        targetFormat: defaultTarget,
        status: 'idle',
        progress: 0,
        originalBlob: file,
        originalUrl,
        mimeType: file.type || 'application/octet-stream',
        createdAt: Date.now(),
        settings: { ...defaultQualitySettings },
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Suporte a Atalhos de Teclado (Ctrl+Enter para converter e Ctrl+V para colar imagens)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleConvertAll();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const pastedFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              const namedFile =
                file.name === 'image.png'
                  ? new File([file], `Pasted_Image_${Date.now()}.png`, { type: file.type })
                  : file;
              pastedFiles.push(namedFile);
            }
          }
        }
        if (pastedFiles.length > 0) {
          handleAddFiles(pastedFiles);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [items, handleAddFiles]);

  // Conversão de um Único Item com Motores Binários 100% Reais
  const handleConvertItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'processing', progress: 15, error: undefined } : i))
    );

    const startTime = performance.now();

    try {
      let convertedBlob: Blob;
      let targetMime = 'application/octet-stream';

      // 1. Motor de Imagem (.ICO, .BMP, .PNG, .WEBP, .SVG)
      if (item.category === 'image') {
        const sourceUrl = item.originalUrl || (item.originalBlob ? URL.createObjectURL(item.originalBlob) : '');
        const img = await loadImageElement(sourceUrl);

        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 50 } : i)));

        convertedBlob = await convertRasterImage(img, item.targetFormat, item.settings);
        targetMime = convertedBlob.type;
      }
      // 2. Motor de Áudio (.WAV PCM 16-bit ou 32-bit Float)
      else if (item.category === 'audio') {
        if (!item.originalBlob) throw new Error('Arquivo original de áudio não disponível.');
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 40 } : i)));

        const audioBuffer = await decodeAudioSource(item.originalBlob);
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 70 } : i)));

        convertedBlob = encodeWavPcm(
          audioBuffer,
          item.settings.audioBitDepth,
          item.settings.audioBitDepth === 32
        );
        targetMime = 'audio/wav';
      }
      // 3. Motor de Vídeo (Extração Real de Áudio WAV ou Captura de Quadros)
      else if (item.category === 'video') {
        if (!item.originalBlob && !item.originalUrl) throw new Error('Arquivo de vídeo não disponível.');
        const blobSource = item.originalBlob || (await (await fetch(item.originalUrl!)).blob());

        const targetNorm = item.targetFormat.toLowerCase();

        if (targetNorm === 'wav') {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 50 } : i)));
          const extracted = await extractAudioFromVideoFile(blobSource, item.settings.audioBitDepth);
          convertedBlob = extracted.wavBlob;
          targetMime = 'audio/wav';
        } else if (['png', 'webp', 'bmp', 'ico'].includes(targetNorm)) {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 45 } : i)));
          const { frameCanvas } = await captureVideoFrame(blobSource, 1.0);
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 75 } : i)));

          const frameDataUrl = frameCanvas.toDataURL('image/png');
          const img = await loadImageElement(frameDataUrl);
          convertedBlob = await convertRasterImage(img, item.targetFormat, item.settings);
          targetMime = convertedBlob.type;
        } else {
          convertedBlob = blobSource;
          targetMime = blobSource.type;
        }
      }
      // 4. Motor de Dados e Documentos (JSON, CSV, TSV, SQL, XML, YAML, MD, HTML)
      else if (item.category === 'data' || item.category === 'document') {
        if (!item.originalBlob) throw new Error('Arquivo de dados não disponível.');
        const text = await item.originalBlob.text();
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 60 } : i)));

        convertedBlob = await convertDataDocument(text, item.inputFormat, item.targetFormat);
        targetMime = convertedBlob.type;
      } else {
        if (!item.originalBlob) throw new Error('Arquivo não disponível.');
        convertedBlob = item.originalBlob;
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      const convertedUrl = URL.createObjectURL(convertedBlob);

      if (item.convertedUrl) {
        URL.revokeObjectURL(item.convertedUrl);
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                convertedBlob,
                convertedUrl,
                convertedSize: convertedBlob.size,
                executionTimeMs,
                mimeType: targetMime,
              }
            : i
        )
      );
    } catch (err) {
      console.error(err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'error',
                progress: 0,
                error: err instanceof Error ? err.message : 'Falha desconhecida na conversão',
              }
            : i
        )
      );
    }
  };

  // Conversão de Toda a Fila em Lote
  const handleConvertAll = async () => {
    if (items.length === 0) return;
    setIsProcessingBatch(true);
    const pendingItems = items.filter((i) => i.status !== 'completed');

    for (const item of pendingItems) {
      await handleConvertItem(item.id);
    }

    setIsProcessingBatch(false);
  };

  // Alteração Global do Formato de Destino ("Converter todos para: [Formato ▾]")
  const handleChangeAllTargetFormat = (newFormat: string) => {
    const fmtUpper = newFormat.toUpperCase();
    setItems((prev) =>
      prev.map((item) => {
        let isApplicable = false;
        if (['PNG', 'WEBP', 'JPG', 'ICO', 'BMP', 'SVG'].includes(fmtUpper) && (item.category === 'image' || item.category === 'video')) {
          isApplicable = true;
        } else if (['WAV', 'MP3', 'FLAC', 'AAC'].includes(fmtUpper) && (item.category === 'audio' || item.category === 'video')) {
          isApplicable = true;
        } else if (['JSON', 'CSV', 'TSV', 'SQL', 'XML', 'YAML', 'MD', 'HTML'].includes(fmtUpper) && item.category === 'data') {
          isApplicable = true;
        }

        if (isApplicable) {
          return {
            ...item,
            targetFormat: fmtUpper,
            status: item.status === 'completed' ? 'idle' : item.status,
            progress: item.status === 'completed' ? 0 : item.progress,
          };
        }
        return item;
      })
    );
  };

  // Download Compactado em .ZIP de Todos os Itens Concluídos via JSZip
  const handleDownloadAllZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.convertedBlob);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const usedFilenames = new Map<string, number>();

      for (const item of completedItems) {
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        let filename = `${baseName}.${item.targetFormat.toLowerCase()}`;

        if (usedFilenames.has(filename)) {
          const count = usedFilenames.get(filename)! + 1;
          usedFilenames.set(filename, count);
          filename = `${baseName}_${count}.${item.targetFormat.toLowerCase()}`;
        } else {
          usedFilenames.set(filename, 1);
        }

        zip.file(filename, item.convertedBlob!);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `OminiConvert_Batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('Falha ao gerar arquivo ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Extração Rápida de Áudio de Vídeo
  const handleExtractVideoAudio = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, targetFormat: 'WAV' } : i))
    );
    await handleConvertItem(id);
  };

  // Captura Rápida de Quadro de Vídeo
  const handleCaptureVideoFrame = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, targetFormat: 'PNG' } : i))
    );
    await handleConvertItem(id);
  };

  // Remoção de Item com Revogação de Recursos
  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompleted = () => {
    items.forEach((item) => {
      if (item.status === 'completed') {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      }
    });
    setItems((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setItems([]);
  };

  const handleChangeTargetFormat = (id: string, format: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, targetFormat: format, status: 'idle', progress: 0 } : i))
    );
  };

  const handleSaveSettings = (settings: QualitySettings) => {
    if (!settingsModalItem) return;
    setItems((prev) =>
      prev.map((i) => (i.id === settingsModalItem.id ? { ...i, settings } : i))
    );
  };

  const activeQueueCount = items.length;
  const completedQueueCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* Barra Superior Windows 11 com Branding OminiConvert e Indicador de RAM */}
      <TitleBarWindows
        activeQueueCount={activeQueueCount}
        completedQueueCount={completedQueueCount}
      />

      {/* Conteúdo Principal Focado Totalmente na Fila de Conversão */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <BatchQueueManager
          items={items}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddFiles={handleAddFiles}
          onConvertItem={handleConvertItem}
          onConvertAll={handleConvertAll}
          onRemoveItem={handleRemoveItem}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          onOpenSettings={(item) => setSettingsModalItem(item)}
          onChangeTargetFormat={handleChangeTargetFormat}
          onChangeAllTargetFormat={handleChangeAllTargetFormat}
          onExtractVideoAudio={handleExtractVideoAudio}
          onCaptureVideoFrame={handleCaptureVideoFrame}
          onDownloadAllZip={handleDownloadAllZip}
          isProcessingBatch={isProcessingBatch}
          isZipping={isZipping}
        />
      </main>

      {/* Modal de Configuração Granular de Qualidade */}
      {settingsModalItem && (
        <QualityInspectorModal
          item={settingsModalItem}
          isOpen={!!settingsModalItem}
          onClose={() => setSettingsModalItem(null)}
          onSaveSettings={handleSaveSettings}
        />
      )}
    </div>
  );
}
