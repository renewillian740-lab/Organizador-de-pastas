import {
  FolderTree,
  Columns,
  Terminal,
  Bookmark,
  BookmarkCheck,
  CheckSquare,
} from 'lucide-react';
import { MainNavSection } from './MacNavSidebar';

interface MacTitleBarProps {
  currentSection: MainNavSection;
  activeTab: 'tree' | 'columns' | 'terminal';
  setActiveTab: (tab: 'tree' | 'columns' | 'terminal') => void;
  rootFolderName: string;
  selectedFoldersCount: number;
  onExecuteMac: () => void;
  onSaveTemplate: () => void;
  onOpenSavedTemplates: () => void;
}

export function MacTitleBar({
  currentSection,
  activeTab,
  setActiveTab,
  rootFolderName,
  selectedFoldersCount,
  onExecuteMac,
  onSaveTemplate,
  onOpenSavedTemplates,
}: MacTitleBarProps) {
  return (
    <header className="bg-neutral-900/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 select-none flex flex-wrap items-center justify-between gap-3 text-sm">
      {/* Left: Traffic lights & App branding */}
      <div className="flex items-center space-x-3">
        {/* macOS Traffic Lights */}
        <div className="flex items-center space-x-2 mr-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm" title="Fechar" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm" title="Minimizar" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm" title="Expandir" />
        </div>

        {/* Name and Subtitle requested */}
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-white">
            ORGANIZADOR
          </span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">
            Organize seus arquivos automaticamente.
          </span>
        </div>
      </div>

      {/* Center: Segmented Controls when in 'organizar' section */}
      {currentSection === 'organizar' ? (
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
            <span className="hidden sm:inline">Árvore com Seleção</span>
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
            <span className="hidden sm:inline">Colunas Mac</span>
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
            <span className="hidden sm:inline">Terminal .sh</span>
          </button>
        </div>
      ) : (
        <div className="text-[11px] font-mono text-neutral-400 hidden md:flex items-center space-x-2 bg-white/[0.02] border border-white/5 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistema de Arquivos macOS Pronto</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {currentSection === 'organizar' ? (
          <>
            <button
              onClick={onOpenSavedTemplates}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-medium text-xs border border-emerald-500/30 transition active:scale-95"
              title="Ver e gerenciar todos os seus modelos salvos"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Meus Modelos</span>
            </button>

            <button
              id="btn-save-template"
              onClick={onSaveTemplate}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-200 font-medium text-xs border border-white/15 transition active:scale-95"
              title="Salvar esta estrutura atual como meu modelo padrão"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Salvar Padrão</span>
            </button>

            <button
              id="btn-execute-mac"
              onClick={onExecuteMac}
              disabled={selectedFoldersCount === 0}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <span>🍏</span>
              <span>Criar no Mac ({selectedFoldersCount})</span>
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-1 text-xs text-neutral-400 font-mono">
            <span>macOS</span>
            <span className="text-neutral-600">•</span>
            <span className="text-blue-400 font-medium">Finder Edition</span>
          </div>
        )}
      </div>
    </header>
  );
}
