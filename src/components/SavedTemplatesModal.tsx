import { useState, useEffect } from 'react';
import { Bookmark, Trash2, Download, Upload, Plus, X, Folder, Check } from 'lucide-react';
import { FolderNode } from '../types';
import { SavedTemplate } from '../types/template';

const MULTI_TEMPLATES_KEY = 'mac_folder_saved_templates_v1';

interface SavedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRootFolder: FolderNode;
  onLoadTemplate: (folder: FolderNode) => void;
}

export function SavedTemplatesModal({
  isOpen,
  onClose,
  currentRootFolder,
  onLoadTemplate,
}: SavedTemplatesModalProps) {
  const [templates, setTemplates] = useState<SavedTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(MULTI_TEMPLATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [newTemplateName, setNewTemplateName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MULTI_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
  }, [templates]);

  if (!isOpen) return null;

  const handleSaveCurrentAsNew = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTemplateName.trim() || currentRootFolder.name || 'Meu Modelo';
    const newTemplate: SavedTemplate = {
      id: `tmpl-${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rootFolder: JSON.parse(JSON.stringify(currentRootFolder)),
    };

    setTemplates([newTemplate, ...templates]);
    setNewTemplateName('');
    setSuccessMsg(`Modelo "${name}" salvo com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Deseja excluir este modelo salvo?')) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `modelos_pastas_mac_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setTemplates((prev) => [...parsed, ...prev]);
            setSuccessMsg('Modelos importados com sucesso!');
            setTimeout(() => setSuccessMsg(null), 3000);
          }
        } catch (err) {
          alert('Arquivo JSON inválido.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-neutral-800/95 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Gerenciar Meus Modelos Salvos</h2>
              <p className="text-xs text-neutral-400">
                Salve quantos modelos de pastas quiser, carregue-os ou faça backup.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Save Current Template Form */}
          <form onSubmit={handleSaveCurrentAsNew} className="bg-black/30 p-4 rounded-xl border border-white/10 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Salvar Estrutura Atual como Novo Modelo</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Ex: Projeto Web 2026 (${currentRootFolder.name})`}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="flex-1 bg-neutral-800 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow flex items-center space-x-1.5 whitespace-nowrap"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Salvar Modelo</span>
              </button>
            </div>
          </form>

          {/* Export / Import actions */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="text-xs text-neutral-400">
              Total de modelos salvos: <strong className="text-white font-mono">{templates.length}</strong>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportAll}
                disabled={templates.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-neutral-300 text-xs flex items-center space-x-1.5 transition border border-white/10"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Exportar JSON</span>
              </button>

              <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs flex items-center space-x-1.5 transition border border-white/10 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

          {/* List of saved templates */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Seus Modelos Armazenados
            </h3>

            {templates.length === 0 ? (
              <div className="text-center py-10 bg-black/20 rounded-xl border border-dashed border-white/10 text-neutral-500 text-xs">
                Nenhum modelo personalizado salvo ainda. Crie um acima ou importe um arquivo JSON.
              </div>
            ) : (
              templates.map((tmpl) => {
                // Count subfolders
                let count = 0;
                function countNode(n: FolderNode) {
                  count++;
                  if (n.children) n.children.forEach(countNode);
                }
                countNode(tmpl.rootFolder);

                return (
                  <div
                    key={tmpl.id}
                    className="bg-neutral-800/60 hover:bg-neutral-800 border border-white/10 rounded-xl p-3.5 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white truncate font-mono">
                          {tmpl.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-[11px] text-neutral-400 mt-0.5">
                          <span>Criado em: {tmpl.createdAt}</span>
                          <span>•</span>
                          <span className="text-blue-400 font-mono">{count} pastas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          onLoadTemplate(tmpl.rootFolder);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow flex items-center space-x-1"
                        title="Carregar este modelo para edição"
                      >
                        <span>Carregar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Excluir este modelo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/95 px-6 py-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
