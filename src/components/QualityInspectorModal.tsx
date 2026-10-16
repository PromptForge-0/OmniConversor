import React, { useState } from 'react';
import { X, Check, Sliders, ShieldCheck, Video, Music, Image as ImageIcon, Save, Zap } from 'lucide-react';
import { QualitySettings, QueueItem } from '../types/converter';

interface QualityInspectorModalProps {
  item: QueueItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: QualitySettings) => void;
}

export const QualityInspectorModal: React.FC<QualityInspectorModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<QualitySettings>({ ...item.settings });
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>('image');

  const icoAvailableSizes = [16, 32, 48, 64, 128, 256];

  const toggleIcoSize = (size: number) => {
    const exists = settings.icoSizes.includes(size);
    if (exists && settings.icoSizes.length === 1) return; // Mantém pelo menos um
    setSettings((prev) => ({
      ...prev,
      icoSizes: exists ? prev.icoSizes.filter((s) => s !== size) : [...prev.icoSizes, size].sort((a, b) => a - b),
    }));
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'ico-windows') {
      setSettings((prev) => ({
        ...prev,
        lossless: true,
        quality: 100,
        preserveAlpha: true,
        icoSizes: [16, 32, 48, 64, 128, 256],
        resampleFilter: 'bicubic',
      }));
    } else if (presetName === 'lossless-archive') {
      setSettings((prev) => ({
        ...prev,
        lossless: true,
        quality: 100,
        crf: 0,
        directStreamCopy: true,
        audioBitDepth: 32,
        audioSampleRate: 96000,
      }));
    } else if (presetName === 'nvenc-fast') {
      setSettings((prev) => ({
        ...prev,
        videoCodec: 'libx265',
        hardwareAcceleration: 'nvenc',
        crf: 18,
        directStreamCopy: false,
      }));
    } else if (presetName === 'studio-audio') {
      setSettings((prev) => ({
        ...prev,
        audioBitDepth: 32,
        audioSampleRate: 48000,
        audioChannels: 2,
        normalizeGain: true,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Parâmetros de Qualidade & Formato
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Configuração para: <span className="font-mono text-amber-300 font-medium">{item.name}</span> ({item.targetFormat})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Presets Rápidos */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Presets:
          </span>
          <button
            onClick={() => applyPreset('ico-windows')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-400 hover:text-zinc-950 text-slate-300 transition-colors whitespace-nowrap font-medium"
          >
            Ícone Windows .ICO (6 Resoluções)
          </button>
          <button
            onClick={() => applyPreset('lossless-archive')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-400 hover:text-zinc-950 text-slate-300 transition-colors whitespace-nowrap font-medium"
          >
            Lossless Matemático (CRF 0)
          </button>
          <button
            onClick={() => applyPreset('nvenc-fast')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-400 hover:text-zinc-950 text-slate-300 transition-colors whitespace-nowrap font-medium"
          >
            NVIDIA NVENC HEVC (GPU)
          </button>
          <button
            onClick={() => applyPreset('studio-audio')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-400 hover:text-zinc-950 text-slate-300 transition-colors whitespace-nowrap font-medium"
          >
            WAV 32-bit Studio Master
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-4 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('image')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'image'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagem & Ícones (.ICO / .BMP)</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'video'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Vídeo & Codecs (CRF / Remux)</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Áudio PCM (.WAV / 32b Float)</span>
          </button>
        </div>

        {/* Conteúdo Granular por Aba */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Modo Lossless Pixel-Perfect</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Preserva exatamente cada valor de pixel sem subamostragem ou compressão destrutiva.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lossless}
                    onChange={(e) => setSettings({ ...settings, lossless: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {!settings.lossless && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Fator de Qualidade:</span>
                    <span className="font-mono text-amber-400 font-semibold">{settings.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.quality}
                    onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                    className="w-full accent-amber-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Seletor de Resoluções para .ICO */}
              <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-xs font-semibold text-slate-200 mb-1">
                  Camadas Embutidas para Ícones Windows (.ICO)
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  Selecione as resoluções que serão empacotadas no arquivo binário .ico final:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {icoAvailableSizes.map((size) => {
                    const isSelected = settings.icoSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleIcoSize(size)}
                        className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold shadow-xs'
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{size}x{size}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Chroma Subsampling
                  </label>
                  <select
                    value={settings.chromaSubsampling}
                    onChange={(e) => setSettings({ ...settings, chromaSubsampling: e.target.value as '4:4:4' | '4:2:0' })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="4:4:4">4:4:4 (Sem Perda de Cor / Studio)</option>
                    <option value="4:2:0">4:2:0 (Padrão Web / Menor Tamanho)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Filtro de Interpolação
                  </label>
                  <select
                    value={settings.resampleFilter}
                    onChange={(e) => setSettings({ ...settings, resampleFilter: e.target.value as 'bicubic' | 'bilinear' | 'nearest' })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="bicubic">Bicúbico / Lanczos (Mais Nítido)</option>
                    <option value="bilinear">Bilinear (Suave)</option>
                    <option value="nearest">Nearest Neighbor (Pixel Art)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Direct Stream Copy (-c copy / Remux)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Altera o formato do contêiner (ex: MKV para MP4) sem recodificar nenhum quadro. Zero perda e velocidade instantânea.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.directStreamCopy}
                    onChange={(e) => setSettings({ ...settings, directStreamCopy: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {!settings.directStreamCopy && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Codec de Vídeo
                      </label>
                      <select
                        value={settings.videoCodec}
                        onChange={(e) => setSettings({ ...settings, videoCodec: e.target.value as QualitySettings['videoCodec'] })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="libx264">H.264 / AVC (Máxima Compatibilidade)</option>
                        <option value="libx265">H.265 / HEVC (Alta Eficiência)</option>
                        <option value="libsvtav1">AV1 (Próxima Geração Royalty-Free)</option>
                        <option value="libvpx-vp9">VP9 (Padrão YouTube / WebM)</option>
                        <option value="prores">Apple ProRes (Edição Profissional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Aceleração de Hardware (GPU)
                      </label>
                      <select
                        value={settings.hardwareAcceleration}
                        onChange={(e) => setSettings({ ...settings, hardwareAcceleration: e.target.value as QualitySettings['hardwareAcceleration'] })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="none">CPU Software Puro (x264 / x265)</option>
                        <option value="nvenc">NVIDIA NVENC (GeForce RTX/GTX)</option>
                        <option value="amf">AMD AMF (Radeon RX)</option>
                        <option value="qsv">Intel QuickSync (Arc / UHD)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Constant Rate Factor (CRF):</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        CRF {settings.crf} {settings.crf === 0 ? '(Lossless)' : settings.crf <= 18 ? '(Visually Lossless)' : '(Padrão)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="51"
                      value={settings.crf}
                      onChange={(e) => setSettings({ ...settings, crf: Number(e.target.value) })}
                      className="w-full accent-amber-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>0 (Sem Perda)</span>
                      <span>18 (Visually Lossless)</span>
                      <span>23 (Default)</span>
                      <span>51 (Máxima Compressão)</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Taxa de Amostragem (Sample Rate)
                  </label>
                  <select
                    value={settings.audioSampleRate}
                    onChange={(e) => setSettings({ ...settings, audioSampleRate: Number(e.target.value) as QualitySettings['audioSampleRate'] })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="44100">44.1 kHz (CD Audio)</option>
                    <option value="48000">48.0 kHz (Padrão Vídeo / Studio)</option>
                    <option value="96000">96.0 kHz (Hi-Res Audio)</option>
                    <option value="192000">192.0 kHz (Ultra Hi-Res Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Profundidade de Bits (Bit Depth)
                  </label>
                  <select
                    value={settings.audioBitDepth}
                    onChange={(e) => setSettings({ ...settings, audioBitDepth: Number(e.target.value) as QualitySettings['audioBitDepth'] })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="16">16-bit PCM Inteiro</option>
                    <option value="24">24-bit PCM Inteiro</option>
                    <option value="32">32-bit IEEE Float (Dinâmica Infinita)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Canais de Áudio
                  </label>
                  <select
                    value={settings.audioChannels}
                    onChange={(e) => setSettings({ ...settings, audioChannels: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="2">Stereo (2 Canais L/R)</option>
                    <option value="1">Mono (1 Canal Central)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Taxa de Bits (para formatos compactados)
                  </label>
                  <select
                    value={settings.audioBitrate}
                    onChange={(e) => setSettings({ ...settings, audioBitrate: e.target.value as QualitySettings['audioBitrate'] })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="320k">320 kbps (CBR Studio)</option>
                    <option value="256k">256 kbps (Alta Fidelidade)</option>
                    <option value="192k">192 kbps (Padrão)</option>
                    <option value="lossless">Lossless Puro (FLAC/ALAC)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSaveSettings(settings);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-[0.98]"
          >
            <Save className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
            <span>Aplicar Parâmetros ao Arquivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
