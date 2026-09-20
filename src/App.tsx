import { useState, useEffect } from 'react';
import { DEFAULT_ROOT_FOLDER } from './data/defaultStructure';
import { FolderNode } from './types';
import { calculateFolderStats } from './utils/macFolderUtils';
import { MacTitleBar } from './components/MacTitleBar';
import { MacSidebar } from './components/MacSidebar';
import { MacNavSidebar, MainNavSection } from './components/MacNavSidebar';
import { FinderTreeView } from './components/FinderTreeView';
import { FinderColumnView } from './components/FinderColumnView';
import { MacTerminalView } from './components/MacTerminalView';
import { MacActionModal } from './components/MacActionModal';
import { SavedTemplatesModal } from './components/SavedTemplatesModal';
import { OrganizeDashboard } from './components/OrganizeDashboard';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { loadSavedRules, saveRules, resetRulesToDefault } from './services/rules';
import { loadHistory } from './services/history';
import { loadPreferences, savePreferences, resetPreferencesToDefault } from './services/settings';
import { CustomFileRule, AppPreferences, OrganizationResultSummary } from './types/organizer';

const STORAGE_KEY = 'mac_folder_custom_template_v1';

export function App() {
  // Navigation section
  const [currentSection, setCurrentSection] = useState<MainNavSection>('inicio');

  // Existing tree builder state
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

  // Settings & History state
  const [customRules, setCustomRules] = useState<CustomFileRule[]>(loadSavedRules);
  const [preferences, setPreferences] = useState<AppPreferences>(loadPreferences);
  const [historyList, setHistoryList] = useState<OrganizationResultSummary[]>(loadHistory);

  const stats = calculateFolderStats(rootFolder);

  // Helper to count total available folders
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

  // Refresh history from storage
  const handleRefreshHistory = () => {
    setHistoryList(loadHistory());
  };

  // Save rules
  const handleSaveRules = (rules: CustomFileRule[]) => {
    setCustomRules(rules);
    saveRules(rules);
  };

  // Save preferences
  const handleSavePreferences = (prefs: AppPreferences) => {
    setPreferences(prefs);
    savePreferences(prefs);
  };

  // Reset all settings
  const handleResetAllSettings = () => {
    const defRules = resetRulesToDefault();
    setCustomRules(defRules);
    const defPrefs = resetPreferencesToDefault();
    setPreferences(defPrefs);
  };

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
      <div className="relative w-full max-w-6xl h-[90vh] min-h-[620px] max-h-[920px] bg-neutral-900/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/50">
        {/* macOS Title Bar with Traffic Lights & Navigation */}
        <MacTitleBar
          currentSection={currentSection}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          rootFolderName={rootFolder.name}
          selectedFoldersCount={stats.totalFolders}
          onExecuteMac={() => setIsActionModalOpen(true)}
          onSaveTemplate={handleSaveCustomTemplate}
          onOpenSavedTemplates={() => setIsSavedTemplatesOpen(true)}
        />

        {/* Window Body: App Navigation Sidebar + Section View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main App Navigation Sidebar (INÍCIO, ORGANIZAR, HISTÓRICO, CONFIGURAÇÕES) */}
          <MacNavSidebar
            currentSection={currentSection}
            onSelectSection={setCurrentSection}
            historyCount={historyList.length}
          />

          {/* Section 1: INÍCIO (The Streamlined Drag/Select -> Model -> Preview -> Execute -> Result flow) */}
          {currentSection === 'inicio' && (
            <OrganizeDashboard
              customRules={customRules}
              onNavigateToHistory={() => {
                handleRefreshHistory();
                setCurrentSection('historico');
              }}
              onNavigateToSettings={() => setCurrentSection('configuracoes')}
            />
          )}

          {/* Section 2: ORGANIZAR (The Advanced macOS Folder Tree / Column / Terminal Editor) */}
          {currentSection === 'organizar' && (
            <div className="flex-1 flex overflow-hidden">
              <div className="hidden lg:flex">
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
          )}

          {/* Section 3: HISTÓRICO */}
          {currentSection === 'historico' && (
            <HistoryView
              history={historyList}
              onRefreshHistory={handleRefreshHistory}
              onNavigateToOrganize={() => setCurrentSection('inicio')}
            />
          )}

          {/* Section 4: CONFIGURAÇÕES */}
          {currentSection === 'configuracoes' && (
            <SettingsView
              customRules={customRules}
              onSaveRules={handleSaveRules}
              preferences={preferences}
              onSavePreferences={handleSavePreferences}
              onResetAllSettings={handleResetAllSettings}
              onHistoryCleared={handleRefreshHistory}
            />
          )}
        </div>

        {/* Mobile / Small Screen Bottom Navigation Bar */}
        <div className="md:hidden border-t border-white/10 bg-neutral-950/90 backdrop-blur-md px-3 py-2 flex items-center justify-around text-[10px] font-semibold">
          <button
            onClick={() => setCurrentSection('inicio')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
              currentSection === 'inicio' ? 'text-blue-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <span>INÍCIO</span>
          </button>
          <button
            onClick={() => setCurrentSection('organizar')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
              currentSection === 'organizar' ? 'text-blue-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <span>ORGANIZAR</span>
          </button>
          <button
            onClick={() => {
              handleRefreshHistory();
              setCurrentSection('historico');
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
              currentSection === 'historico' ? 'text-blue-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <span>HISTÓRICO</span>
          </button>
          <button
            onClick={() => setCurrentSection('configuracoes')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
              currentSection === 'configuracoes' ? 'text-blue-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <span>CONFIGURAÇÕES</span>
          </button>
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
