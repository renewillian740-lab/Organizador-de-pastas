import { useState, useEffect } from 'react';
import { DEFAULT_ROOT_FOLDER } from './data/defaultStructure';
import { FolderNode } from './types';
import { calculateFolderStats } from './utils/macFolderUtils';
import { MacTitleBar } from './components/MacTitleBar';
import { MacSidebar } from './components/MacSidebar';
import { FinderTreeView } from './components/FinderTreeView';
import { FinderColumnView } from './components/FinderColumnView';
import { MacTerminalView } from './components/MacTerminalView';
import { MacActionModal } from './components/MacActionModal';
import { SavedTemplatesModal } from './components/SavedTemplatesModal';

const STORAGE_KEY = 'mac_folder_custom_template_v1';

export function App() {
  const [rootFolder, setRootFolder] = useState<FolderNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_ROOT_FOLDER));
  });

  const [activeTab, setActiveTab] = useState<'tree' | 'columns' | 'terminal'>('tree');
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isSavedTemplatesOpen, setIsSavedTemplatesOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const stats = calculateFolderStats(rootFolder);

  // Helper to count total available folders (including unselected)
  const countAllNodes = (node: FolderNode): number => {
    let c = 1;
    if (node.children) {
      for (const child of node.children) {
        c += countAllNodes(child);
      }
    }
    return c;
  };
  const totalAvailable = countAllNodes(rootFolder);

  // Save current structure as user's custom default template
  const handleSaveCustomTemplate = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rootFolder));
      setSaveSuccessMsg('Modelo padrão salvo com sucesso!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar modelo no navegador.');
    }
  };

  // Select all folders
  const handleSelectAll = () => {
    function update(node: FolderNode): FolderNode {
      return {
        ...node,
        enabled: true,
        children: node.children ? node.children.map(update) : undefined,
      };
    }
    setRootFolder(update(rootFolder));
  };

  // Deselect all folders (except root)
  const handleDeselectAll = () => {
    function update(node: FolderNode): FolderNode {
      const isRoot = node.id === rootFolder.id;
      return {
        ...node,
        enabled: isRoot ? true : false,
        children: node.children ? node.children.map(update) : undefined,
      };
    }
    setRootFolder(update(rootFolder));
  };

  // Start fresh with clean empty root folder
  const handleNewRoot = () => {
    const newRootName = prompt('Digite o nome da pasta principal:', 'NOVO_PROJETO') || 'NOVO_PROJETO';
    setRootFolder({
      id: `root-${Date.now()}`,
      name: newRootName.trim().replace(/[\\/:*?"<>|]/g, '_'),
      tagColor: 'blue',
      isExpanded: true,
      enabled: true,
      children: [
        {
          id: `f-${Date.now()}-1`,
          name: '01_Arquivos',
          enabled: true,
        },
        {
          id: `f-${Date.now()}-2`,
          name: '02_Trabalho',
          enabled: true,
        },
      ],
    });
  };

  // Add a subfolder to root
  const handleAddSubfolderToRoot = () => {
    const newId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nextNumber = ((rootFolder.children?.length || 0) + 1).toString().padStart(2, '0');
    setRootFolder({
      ...rootFolder,
      children: [
        ...(rootFolder.children || []),
        {
          id: newId,
          name: `${nextNumber}_Nova_Pasta`,
          isExpanded: true,
          enabled: true,
          children: [],
        },
      ],
    });
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Deseja restaurar o modelo padrão original do sistema?')) {
      localStorage.removeItem(STORAGE_KEY);
      setRootFolder(JSON.parse(JSON.stringify(DEFAULT_ROOT_FOLDER)));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-neutral-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none relative">
      {/* Toast Notification for Saving */}
      {saveSuccessMsg && (
        <div className="fixed top-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 text-xs flex items-center space-x-2 animate-bounce">
          <span>💾</span>
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main macOS Application Window */}
      <div className="relative w-full max-w-5xl h-[88vh] min-h-[580px] max-h-[880px] bg-neutral-900/90 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/50">
        {/* macOS Title Bar with Traffic Lights & Navigation */}
        <MacTitleBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          rootFolderName={rootFolder.name}
          selectedFoldersCount={stats.totalFolders}
          onExecuteMac={() => setIsActionModalOpen(true)}
          onSaveTemplate={handleSaveCustomTemplate}
          onOpenSavedTemplates={() => setIsSavedTemplatesOpen(true)}
        />

        {/* Window Body: Sidebar + Main Content View */}
        <div className="flex-1 flex overflow-hidden">
          {/* macOS Finder Sidebar */}
          <div className="hidden md:flex">
            <MacSidebar
              stats={stats}
              totalAvailable={totalAvailable}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onNewRoot={handleNewRoot}
              onAddSubfolderToRoot={handleAddSubfolderToRoot}
              onResetToDefault={handleResetToDefault}
              onSaveTemplate={handleSaveCustomTemplate}
              onOpenSavedTemplates={() => setIsSavedTemplatesOpen(true)}
              onExecuteMac={() => setIsActionModalOpen(true)}
              rootFolder={rootFolder}
            />
          </div>

          {/* Main View Area */}
          <main className="flex-1 p-3 sm:p-4 bg-black/40 overflow-hidden flex flex-col">
            {activeTab === 'tree' && (
              <FinderTreeView
                rootFolder={rootFolder}
                onChange={setRootFolder}
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node.id)}
                onExecuteMac={() => setIsActionModalOpen(true)}
              />
            )}

            {activeTab === 'columns' && (
              <FinderColumnView
                rootFolder={rootFolder}
                onChange={setRootFolder}
              />
            )}

            {activeTab === 'terminal' && (
              <MacTerminalView
                rootFolder={rootFolder}
                onOpenDirectModal={() => setIsActionModalOpen(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Action Modal for creating in Mac */}
      <MacActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        rootFolder={rootFolder}
      />

      {/* Saved Multi-Templates Manager Modal */}
      <SavedTemplatesModal
        isOpen={isSavedTemplatesOpen}
        onClose={() => setIsSavedTemplatesOpen(false)}
        currentRootFolder={rootFolder}
        onLoadTemplate={(folder) => setRootFolder(folder)}
      />
    </div>
  );
}

export default App;
