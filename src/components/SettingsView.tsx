import { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ShieldCheck,
  Laptop,
} from 'lucide-react';
import { CustomFileRule, AppPreferences } from '../types/organizer';
import { resetRulesToDefault } from '../services/rules';
import { clearHistory } from '../services/history';

interface SettingsViewProps {
  customRules: CustomFileRule[];
  onSaveRules: (rules: CustomFileRule[]) => void;
  preferences: AppPreferences;
  onSavePreferences: (prefs: AppPreferences) => void;
  onResetAllSettings: () => void;
  onHistoryCleared: () => void;
}

export function SettingsView({
  customRules,
  onSaveRules,
  preferences,
  onSavePreferences,
  onResetAllSettings,
  onHistoryCleared,
}: SettingsViewProps) {
  const [newExt, setNewExt] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [rules, setRules] = useState<CustomFileRule[]>(customRules);
  const [prefs, setPrefs] = useState<AppPreferences>(preferences);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExt.trim() || !newFolder.trim()) return;

    let cleanExt = newExt.trim().toLowerCase();
    if (!cleanExt.startsWith('.')) cleanExt = `.${cleanExt}`;

    const cleanFolder = newFolder.trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_');

    const updated = [
      ...rules,
      {
        id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        extension: cleanExt,
        targetFolder: cleanFolder,
      },
    ];

    setRules(updated);
    onSaveRules(updated);
    setNewExt('');
    setNewFolder('');
    triggerSuccessToast();
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    onSaveRules(updated);
    triggerSuccessToast();
  };

  const handleResetRules = () => {
    if (confirm('Restaurar regras de organização padrão?')) {
      const def = resetRulesToDefault();
      setRules(def);
      onSaveRules(def);
      triggerSuccessToast();
    }
  };

  const handleToggleDuplicateAction = (action: 'rename' | 'skip') => {
    const updated = { ...prefs, duplicateAction: action };
    setPrefs(updated);
    onSavePreferences(updated);
    triggerSuccessToast();
  };

  const handleClearHistoryConfirm = () => {
    if (confirm('Deseja realmente apagar todo o histórico de arquivos organizados?')) {
      clearHistory();
      onHistoryCleared();
      alert('Histórico apagado com sucesso.');
    }
  };

  const handleResetAllConfirm = () => {
    if (confirm('Deseja restaurar todas as configurações e regras para os padrões originais?')) {
      onResetAllSettings();
      alert('Configurações restauradas para o padrão.');
    }
  };

  const triggerSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <Sliders className="w-7 h-7 text-blue-400" />
            <span>CONFIGURAÇÕES</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Personalize o comportamento e as regras de organização de arquivos.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>Salvo!</span>
          </span>
        )}
      </div>

      {/* App Info Box */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Nome do Aplicativo
          </div>
          <div className="text-base font-bold text-white flex items-center space-x-2">
            <span>ORGANIZADOR DE PASTAS</span>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
              macOS Web App
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Organize seus arquivos automaticamente de forma local e segura no Mac.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl shadow-inner">
          🍏
        </div>
      </div>

      {/* Section: Regras de Organização */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              REGRAS DE ORGANIZAÇÃO
            </h2>
            <p className="text-xs text-neutral-400">
              Mapeie extensões de arquivos para pastas de destino automáticas.
            </p>
          </div>

          <button
            onClick={handleResetRules}
            className="text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Regras Padrão</span>
          </button>
        </div>

        {/* Add rule form */}
        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/[0.02] p-3.5 rounded-xl border border-white/10">
          <input
            type="text"
            value={newExt}
            onChange={(e) => setNewExt(e.target.value)}
            placeholder="Extensão (ex: .mp4)"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />

          <input
            type="text"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="Nome da Pasta (ex: VÍDEOS)"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!newExt.trim() || !newFolder.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>ADICIONAR REGRA</span>
          </button>
        </form>

        {/* Rules list */}
        <div className="bg-black/40 border border-white/10 rounded-xl divide-y divide-white/5 max-h-64 overflow-y-auto custom-scrollbar">
          {rules.map((r) => (
            <div
              key={r.id}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="text-blue-400 font-semibold w-16">{r.extension}</span>
                <span className="text-neutral-500">→</span>
                <span className="text-white font-medium">{r.targetFolder}</span>
              </div>

              <button
                onClick={() => handleDeleteRule(r.id)}
                className="p-1 text-neutral-500 hover:text-red-400 transition"
                title="Remover regra"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Preferências de Duplicados e Segurança */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            PREFERÊNCIAS & SEGURANÇA
          </h2>
          <p className="text-xs text-neutral-400">
            Tratamento de arquivos duplicados e proteção de dados.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white">
                Tratamento de Duplicados
              </div>
              <p className="text-xs text-neutral-400">
                Se já existir um arquivo com o mesmo nome na pasta de destino.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => handleToggleDuplicateAction('rename')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  prefs.duplicateAction === 'rename'
                    ? 'bg-blue-600 text-white font-medium shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Renomear (1).ext
              </button>
              <button
                onClick={() => handleToggleDuplicateAction('skip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  prefs.duplicateAction === 'skip'
                    ? 'bg-blue-600 text-white font-medium shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Ignorar
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center space-x-3 text-xs text-neutral-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Garantia de Segurança:</strong> Seus arquivos originais nunca são apagados e nunca são sobrescritos sem cópia de segurança.
            </span>
          </div>
        </div>
      </div>

      {/* Section: Ações do Sistema */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider text-red-400/90">
            GERENCIAMENTO & RESTAURAÇÃO
          </h2>
          <p className="text-xs text-neutral-400">
            Ações irreversíveis de limpeza e redefinição de fábrica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleClearHistoryConfirm}
            className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-300 transition text-left flex items-start space-x-3"
          >
            <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                LIMPAR HISTÓRICO
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Apaga os registros salvos de organizações anteriores.
              </p>
            </div>
          </button>

          <button
            onClick={handleResetAllConfirm}
            className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-200 transition text-left flex items-start space-x-3"
          >
            <RotateCcw className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                RESTAURAR CONFIGURAÇÕES PADRÃO
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Restaura todas as preferências e regras originais.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
