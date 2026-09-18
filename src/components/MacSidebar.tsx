import {
  CheckSquare,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { FolderStats, FolderNode } from '../types';

interface MacSidebarProps {
  stats: FolderStats;
  totalAvailable: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onNewRoot: () => void;
  onAddSubfolderToRoot: () => void;
  onResetToDefault: () => void;
  onExecuteMac: () => void;
  rootFolder: FolderNode;
}

export function MacSidebar({
  stats,
  totalAvailable,
  onSelectAll,
  onDeselectAll,
  onNewRoot,
  onAddSubfolderToRoot,
  onResetToDefault,
  onExecuteMac,
  rootFolder,
}: MacSidebarProps) {
  return (
    <aside className="w-64 bg-neutral-900/80 backdrop-blur-md border-r border-white/10 flex flex-col justify-between p-3.5 select-none flex-shrink-0">
      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-0.5">
        {/* Section: Ação Principal de Criação */}
        <div>
          <button
            onClick={onExecuteMac}
            disabled={stats.totalFolders === 0}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition active:scale-98"
          >
            <span>🍏</span>
            <span className="font-semibold">Criar no Mac ({stats.totalFolders})</span>
          </button>
        </div>

        {/* Section: Escolha de Pastas */}
        <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-3">
          <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
            <span>Seleção de Pastas</span>
            <span className="text-[10px] font-mono text-blue-400 font-normal">
              {stats.totalFolders} de {totalAvailable}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Escolha exatamente quais pastas você quer que sejam criadas no seu Mac.
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onSelectAll}
              className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 text-xs transition border border-white/5"
              title="Marcar todas as pastas da estrutura"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Todas</span>
            </button>

            <button
              onClick={onDeselectAll}
              className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs transition border border-white/5"
              title="Desmarcar todas as pastas da estrutura"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Nenhuma</span>
            </button>
          </div>
        </div>

        {/* Section: Gerenciamento Rápido */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
            Organização
          </div>

          <button
            onClick={onAddSubfolderToRoot}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition text-xs text-left"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Adicionar Nova Pasta</span>
          </button>

          <button
            onClick={onNewRoot}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition text-xs text-left"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Limpar e Começar do Zero</span>
          </button>
        </div>

        {/* Section: Resumo das Pastas Ativas */}
        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Resumo
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Pasta Raiz:</span>
              <span className="font-mono text-white text-[11px] truncate max-w-[120px]" title={rootFolder.name}>
                {rootFolder.name}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Pastas marcadas:</span>
              <span className="font-mono text-blue-400 font-semibold">{stats.totalFolders}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Profundidade:</span>
              <span className="font-mono text-purple-400">{stats.maxDepth} níveis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="pt-3 border-t border-white/10 space-y-1.5">
        <button
          onClick={onResetToDefault}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-xs transition"
          title="Restaurar estrutura padrão"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restaurar Modelo Base</span>
        </button>

        <div className="text-[10px] text-center text-neutral-500">
          Criador Automático de Pastas para Mac
        </div>
      </div>
    </aside>
  );
}
