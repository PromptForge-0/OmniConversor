import React, { useRef, useState } from 'react';
import { QueueItem, FileCategory } from '../types/converter';
import {
  Upload,
  Play,
  Trash2,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  Archive,
  Database,
  Camera,
  Archive as ZipIcon,
  ChevronRight,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface BatchQueueManagerProps {
  items: QueueItem[];
  selectedCategory: 'all' | FileCategory;
  onSelectCategory: (category: 'all' | FileCategory) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onConvertItem: (id: string) => Promise<void>;
  onConvertAll: () => Promise<void>;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onOpenSettings: (item: QueueItem) => void;
  onChangeTargetFormat: (id: string, format: string) => void;
  onChangeAllTargetFormat: (format: string) => void;
  onExtractVideoAudio: (id: string) => Promise<void>;
  onCaptureVideoFrame: (id: string) => Promise<void>;
  onDownloadAllZip: () => Promise<void>;
  isProcessingBatch: boolean;
  isZipping?: boolean;
}

export const BatchQueueManager: React.FC<BatchQueueManagerProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
  onAddFiles,
  onConvertItem,
  onConvertAll,
  onRemoveItem,
  onClearCompleted,
  onClearAll,
  onOpenSettings,
  onChangeTargetFormat,
  onChangeAllTargetFormat,
  onExtractVideoAudio,
  onCaptureVideoFrame,
  onDownloadAllZip,
  isProcessingBatch,
  isZipping = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [batchTargetFormat, setBatchTargetFormat] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleBatchFormatChange = (fmt: string) => {
    setBatchTargetFormat(fmt);
    if (fmt) {
      onChangeAllTargetFormat(fmt);
    }
  };

  const filteredItems = items.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const formatOptionsByCategory: Record<FileCategory, string[]> = {
    image: ['ICO', 'BMP', 'PNG', 'JPG', 'WEBP', 'SVG'],
    video: ['WAV', 'PNG', 'WEBP', 'MP4', 'MKV', 'MOV'],
    audio: ['WAV', 'FLAC', 'MP3', 'AAC', 'OGG'],
    data: ['SQL', 'JSON', 'CSV', 'TSV', 'XML', 'YAML', 'MD', 'HTML'],
    document: ['HTML', 'MD', 'TXT', 'JSON'],
    archive: ['ZIP', '7Z', 'TAR.GZ'],
  };

  const handleDownloadSingle = (item: QueueItem) => {
    if (!item.convertedBlob) return;
    const url = item.convertedUrl || URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    a.download = `${baseName}_converted.${item.targetFormat.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const isQueueEmpty = items.length === 0;

  // Cálculos de métricas da barra de resumo (Summary Bar)
  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const completedItems = items.filter((i) => i.status === 'completed' && i.convertedSize);
  const totalCompletedOriginalBytes = completedItems.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompletedConvertedBytes = completedItems.reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);
  const bytesSaved = Math.max(0, totalCompletedOriginalBytes - totalCompletedConvertedBytes);
  const overallSavedPercent =
    totalCompletedOriginalBytes > 0
      ? (((totalCompletedOriginalBytes - totalCompletedConvertedBytes) / totalCompletedOriginalBytes) * 100).toFixed(1)
      : '0.0';

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6 pb-24">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) onAddFiles(e.target.files);
        }}
        className="hidden"
      />

      {/* DROPZONE: ESTADO VAZIO (EMPTY STATE) OU ZONA COMPACTA QUANDO POPULADA */}
      {isQueueEmpty ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            isDragOver
              ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_50px_rgba(245,158,11,0.25)] scale-[1.01]'
              : 'border-slate-700/80 hover:border-amber-400/80 bg-slate-900/50 hover:bg-slate-900/80 shadow-2xl hover:shadow-amber-500/10'
          }`}
        >
          {/* Efeito sutil de iluminação de fundo */}
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"></div>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 group-hover:scale-110 flex items-center justify-center text-amber-400 mb-5 transition-transform shadow-[0_0_24px_rgba(245,158,11,0.25)]">
            <Upload className="w-8 h-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-amber-200 transition-colors text-center">
            Arraste seus arquivos aqui ou clique para selecionar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 text-center max-w-lg leading-relaxed">
            Suporte para arrastar e soltar, seleção no disco ou{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-xs">
              Ctrl+V
            </kbd>{' '}
            para colar prints e imagens da área de transferência instantaneamente.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            <span>Selecionar Arquivos do Computador</span>
          </button>

          {/* Chips Visuais com Formatos Suportados */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 max-w-xl">
            {['.PNG', '.WEBP', '.AVIF', '.JPG', '.ICO', '.BMP', '.MP4', '.WAV', '.MP3', '.JSON', '.CSV', '.SQL'].map(
              (fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-900/80 text-slate-400 border border-slate-800/80 group-hover:border-slate-700/90 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
                >
                  {fmt}
                </span>
              )
            )}
          </div>
        </div>
      ) : (
        /* DROPZONE COMPACTO SUPERIOR QUANDO JÁ EXISTEM ARQUIVOS NA FILA */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
              : 'border-slate-800 hover:border-amber-400/60 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Adicionar mais arquivos à fila
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Arraste, clique ou pressione Ctrl+V para colar imagens da área de transferência
              </span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">
            Adicionar
          </span>
        </div>
      )}

      {/* BARRA DE FILTROS E CONTROLES EM LOTE (BATCH ACTIONS) */}
      {!isQueueEmpty && (
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-lg">
            {/* Filtros de Categoria */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 lg:pb-0">
              {(
                [
                  { key: 'all', label: 'Todos' },
                  { key: 'image', label: 'Imagens' },
                  { key: 'audio', label: 'Áudio' },
                  { key: 'video', label: 'Vídeo' },
                  { key: 'data', label: 'Dados' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => onSelectCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Ações Rápidas em Lote */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor Global: Converter Todos Para */}
              <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Converter todos para:</span>
                <select
                  value={batchTargetFormat}
                  onChange={(e) => handleBatchFormatChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold text-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    Selecione...
                  </option>
                  <option value="WEBP" className="bg-slate-900 text-slate-100">
                    .WEBP (Web Moderno)
                  </option>
                  <option value="PNG" className="bg-slate-900 text-slate-100">
                    .PNG (Lossless)
                  </option>
                  <option value="ICO" className="bg-slate-900 text-slate-100">
                    .ICO (Ícone Windows)
                  </option>
                  <option value="JPG" className="bg-slate-900 text-slate-100">
                    .JPG (Compacto)
                  </option>
                  <option value="BMP" className="bg-slate-900 text-slate-100">
                    .BMP (32-bit Raw)
                  </option>
                  <option value="WAV" className="bg-slate-900 text-slate-100">
                    .WAV (Áudio Studio)
                  </option>
                  <option value="JSON" className="bg-slate-900 text-slate-100">
                    .JSON (Dados)
                  </option>
                  <option value="CSV" className="bg-slate-900 text-slate-100">
                    .CSV (Planilha)
                  </option>
                  <option value="SQL" className="bg-slate-900 text-slate-100">
                    .SQL (Tabelas)
                  </option>
                </select>
              </div>

              {/* Botão Baixar Todos em .ZIP (dinâmico via JSZip) */}
              <button
                onClick={onDownloadAllZip}
                disabled={completedCount === 0 || isZipping}
                title={
                  completedCount === 0
                    ? 'Conclua a conversão de itens para baixar o pacote compactado'
                    : 'Baixar todos os arquivos convertidos compactados em um único arquivo .ZIP'
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs ${
                  completedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
                }`}
              >
                <ZipIcon className="w-3.5 h-3.5" />
                <span>
                  {isZipping ? 'Compactando...' : `Baixar Todos (.ZIP)${completedCount > 0 ? ` (${completedCount})` : ''}`}
                </span>
              </button>

              {/* Botão Converter Fila */}
              <button
                onClick={onConvertAll}
                disabled={isProcessingBatch || isQueueEmpty}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-zinc-950 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                <span>{isProcessingBatch ? 'Processando Lote...' : 'Converter Fila (Ctrl+Enter)'}</span>
              </button>

              {/* Botão Limpar */}
              <button
                onClick={onClearCompleted}
                title="Limpar itens já concluídos da lista"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LISTA DE CARDS DE ITENS DA FILA */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-400 text-xs">
                Nenhum arquivo encontrado nesta categoria.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isCompleted = item.status === 'completed';
                const isProcessing = item.status === 'processing';
                const hasError = item.status === 'error';
                const isVideo = item.category === 'video';
                const isImage = item.category === 'image';

                // Cálculo do ganho de eficiência
                const hasConvertedSize = !!item.convertedSize;
                const sizeDifference = hasConvertedSize ? item.convertedSize! - item.originalSize : 0;
                const percentChange = hasConvertedSize
                  ? (((item.convertedSize! - item.originalSize) / item.originalSize) * 100).toFixed(1)
                  : '0';
                const isReduced = hasConvertedSize && sizeDifference < 0;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl bg-slate-900/70 backdrop-blur-md border transition-all duration-200 relative overflow-hidden group ${
                      isCompleted
                        ? 'border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.06)]'
                        : isProcessing
                        ? 'border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                        : 'border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* MINIATURA VISUAL REAL OU ÍCONE CATEGORIAL */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isImage && item.originalUrl ? (
                          <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center group-hover:border-amber-500/50 transition-colors shadow-xs">
                            <img
                              src={item.originalUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback para ícone se der erro de carregamento
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : isVideo && item.originalUrl ? (
                          <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                            <video
                              src={item.originalUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Video className="w-4 h-4 text-amber-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                            {item.category === 'audio' ? (
                              <Music className="w-5 h-5 text-emerald-400" />
                            ) : item.category === 'data' ? (
                              <Database className="w-5 h-5 text-amber-400" />
                            ) : item.category === 'archive' ? (
                              <Archive className="w-5 h-5 text-amber-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-amber-300" />
                            )}
                          </div>
                        )}

                        {/* Detalhes do Arquivo */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-100 truncate max-w-xs md:max-w-md">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                              {item.inputFormat}
                            </span>

                            {/* Badge de Status Dinâmico */}
                            {isProcessing && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse">
                                Convertendo ({item.progress}%)
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Concluído</span>
                              </span>
                            )}
                            {hasError && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/60">
                                Erro
                              </span>
                            )}
                          </div>

                          {/* Metadados e Ganho de Eficiência */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                            {!isCompleted ? (
                              <span>{formatFileSize(item.originalSize)}</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 line-through text-[10px]">
                                  {formatFileSize(item.originalSize)}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                                <span className="text-slate-200 font-semibold">
                                  {formatFileSize(item.convertedSize!)}
                                </span>
                                {isReduced ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>{percentChange}%</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">({percentChange}%)</span>
                                )}
                              </div>
                            )}

                            {item.width && item.height && (
                              <>
                                <span>·</span>
                                <span>
                                  {item.width}×{item.height} px
                                </span>
                              </>
                            )}
                            {item.duration && (
                              <>
                                <span>·</span>
                                <span>{item.duration.toFixed(1)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seletor de Formato Alvo & Controles */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Para:</span>
                          <select
                            value={item.targetFormat}
                            onChange={(e) => onChangeTargetFormat(item.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-amber-400 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            {formatOptionsByCategory[item.category]?.map((fmt) => (
                              <option key={fmt} value={fmt} className="bg-slate-900 text-slate-200">
                                .{fmt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Parâmetros Granulares */}
                        <button
                          onClick={() => onOpenSettings(item)}
                          title="Ajustar Parâmetros de Qualidade (Lossless, CRF, Bitrate, ICO Layers)"
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Sliders className="w-4 h-4 text-amber-400" />
                        </button>

                        {/* Ações Especiais de Vídeo */}
                        {isVideo && (
                          <>
                            <button
                              onClick={() => onExtractVideoAudio(item.id)}
                              title="Extrair áudio deste vídeo diretamente em arquivo .WAV PCM"
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs font-mono flex items-center gap-1 transition-colors"
                            >
                              <Music className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Áudio (.WAV)</span>
                            </button>

                            <button
                              onClick={() => onCaptureVideoFrame(item.id)}
                              title="Capturar quadro em alta resolução para gerar .PNG ou .ICO"
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1 transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Quadro</span>
                            </button>
                          </>
                        )}

                        {/* Botão de Ação: Converter ou Baixar */}
                        {!isCompleted ? (
                          <button
                            onClick={() => onConvertItem(item.id)}
                            disabled={isProcessing}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-zinc-950 flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                          >
                            <Play className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                            <span>{isProcessing ? 'Convertendo...' : 'Converter'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownloadSingle(item)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          >
                            <Download className="w-3 h-3" />
                            <span>Baixar</span>
                          </button>
                        )}

                        {/* Remover */}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          title="Remover arquivo da fila"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* BARRA DE PROGRESSO ULTRAFINA NA BORDA INFERIOR DO CARD */}
                    {isProcessing && (
                      <div className="mt-3 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 ease-out"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}

                    {hasError && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-rose-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.error || 'Ocorreu um erro na conversão.'}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FLUTUANTE (SUMMARY BAR) */}
      {!isQueueEmpty && (
        <aside
          aria-label="Resumo do processamento em lote"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 sm:px-6 sm:py-3.5 shadow-2xl z-40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>
                <strong className="text-white">{items.length}</strong> {items.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{formatFileSize(totalOriginalBytes)}</span>
            </div>

            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 border-l border-slate-800 pl-4">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  <strong>{completedCount}</strong> prontos
                </span>
                {bytesSaved > 0 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-300">
                      -{formatFileSize(bytesSaved)} (-{overallSavedPercent}%)
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {completedCount > 0 && (
              <button
                onClick={onDownloadAllZip}
                disabled={isZipping}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ZipIcon className="w-3.5 h-3.5" />
                <span>{isZipping ? 'Gerando ZIP...' : 'Baixar ZIP'}</span>
              </button>
            )}

            <button
              onClick={onConvertAll}
              disabled={isProcessingBatch || completedCount === items.length}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
            >
              <Play className="w-3 h-3 fill-zinc-950 text-zinc-950" />
              <span>{isProcessingBatch ? 'Processando...' : 'Converter Todos'}</span>
            </button>

            <button
              onClick={onClearAll}
              title="Limpar todos os arquivos da fila"
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
