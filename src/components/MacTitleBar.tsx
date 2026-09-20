import { FolderTree, Columns, Terminal, CheckSquare, Bookmark, BookmarkCheck } from 'lucide-react';

interface MacTitleBarProps {
  activeTab: 'tree' | 'columns' | 'terminal';
  setActiveTab: (tab: 'tree' | 'columns' | 'terminal') => void;
  rootFolderName: string;
  selectedFoldersCount: number;
  onExecuteMac: () => void;
  onSaveTemplate: () => void;
  onOpenSavedTemplates: () => void;
}

export function MacTitleBar({
  activeTab,
  setActiveTab,
  rootFolderName,
  selectedFoldersCount,
  onExecuteMac,
  onSaveTemplate,
  onOpenSavedTemplates,
}: MacTitleBarProps) {
  return (
    <header className="bg-neutral-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 select-none flex flex-wrap items-center justify-between gap-3 text-sm">
      {/* Left: macOS Traffic Lights & Title */}
      <div className="flex items-center space-x-3">
        {/* macOS Traffic Lights */}
        <div className="flex items-center space-x-2 mr-1">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm" title="Fechar" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm" title="Minimizar" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm" title="Expandir" />
        </div>

        {/* Current Root Folder pill */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-md text-neutral-200">
          <span className="text-blue-400">📁</span>
          <span className="font-medium text-xs md:text-sm truncate max-w-[140px] md:max-w-[200px]" title={rootFolderName}>
            {rootFolderName}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono flex items-center space-x-1">
            <CheckSquare className="w-3 h-3 inline mr-1 text-blue-400" />
            <span>{selectedFoldersCount} a criar</span>
          </span>
        </div>
      </div>

      {/* Center: Clean Segmented Controls (Finder Views) */}
      <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
        <button
          id="btn-tab-tree"
          onClick={() => setActiveTab('tree')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'tree'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Árvore com Seleção</span>
        </button>

        <button
          id="btn-tab-columns"
          onClick={() => setActiveTab('columns')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'columns'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Colunas Mac</span>
        </button>

        <button
          id="btn-tab-terminal"
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'terminal'
              ? 'bg-blue-600 text-white shadow'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Terminal .sh</span>
        </button>
      </div>

      {/* Right: Save Template & Execute Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenSavedTemplates}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-medium text-xs border border-emerald-500/30 transition active:scale-95"
          title="Ver e gerenciar todos os seus modelos salvos"
        >
          <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Meus Modelos</span>
        </button>

        <button
          id="btn-save-template"
          onClick={onSaveTemplate}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-neutral-200 font-medium text-xs border border-white/15 transition active:scale-95"
          title="Salvar esta estrutura atual como meu modelo padrão"
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Salvar Padrão</span>
        </button>

        <button
          id="btn-execute-mac"
          onClick={onExecuteMac}
          disabled={selectedFoldersCount === 0}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <span>🍏</span>
          <span>Criar no Mac</span>
        </button>
      </div>
    </header>
  );
}
