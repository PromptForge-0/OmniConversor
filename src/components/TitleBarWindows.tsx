import React, { useState } from 'react';
import { Minus, Square, Copy, X, Layers, ShieldCheck, Info } from 'lucide-react';

interface TitleBarWindowsProps {
  activeQueueCount: number;
  completedQueueCount: number;
}

export const TitleBarWindows: React.FC<TitleBarWindowsProps> = ({
  activeQueueCount,
  completedQueueCount,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <header className="h-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 select-none z-50 sticky top-0 shadow-xs">
      {/* Zona 1: Ícone do App & Branding Único */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
          <Layers className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
        </div>
        <span className="text-xs font-bold tracking-tight text-slate-100">
          OminiConvert
        </span>
      </div>

      {/* Zona 2: Indicador de Memória & Botões de Janela Windows 11 */}
      <div className="flex items-center gap-3 shrink-0">
        {activeQueueCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span>Fila:</span>
            <span className="text-amber-400 font-semibold tabular-nums">
              {completedQueueCount}/{activeQueueCount}
            </span>
          </div>
        )}

        {/* Pílula de Status de Memória com Mini Indicador e Tooltip Interativo */}
        <div
          className="relative hidden lg:block"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 font-mono transition-colors cursor-help">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>RAM / Safe ObjectURLs</span>
            <Info className="w-3 h-3 text-slate-500 ml-0.5" />
          </div>

          {/* Tooltip Detalhado */}
          {showTooltip && (
            <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-[11px] text-slate-300 z-50 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gerenciamento Ativo de Memória</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Todas as instâncias binárias e Object URLs são desalocadas proativamente com{' '}
                <code className="text-cyan-300 font-mono text-[10px]">URL.revokeObjectURL</code>{' '}
                para eliminar riscos de memory leaks na aba do navegador durante operações em lote.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between font-mono text-[10px] text-slate-500">
                <span>Objetos na Fila:</span>
                <span className="text-slate-300 font-semibold">{activeQueueCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Janela */}
        <div className="flex items-center">
          <button
            title="Minimizar"
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            title={isMaximized ? 'Restaurar Tamanho' : 'Maximizar'}
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            title="Fechar Janela"
            className="w-9 h-7 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
