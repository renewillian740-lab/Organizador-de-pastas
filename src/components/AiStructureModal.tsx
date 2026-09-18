import { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Lightbulb } from 'lucide-react';
import { FolderNode } from '../types';

interface AiStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStructure: (newRoot: FolderNode) => void;
}

export function AiStructureModal({
  isOpen,
  onClose,
  onApplyStructure,
}: AiStructureModalProps) {
  const [prompt, setPrompt] = useState('');
  const [baseName, setBaseName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, descreva o que você precisa organizar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/suggest-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          baseName: baseName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao gerar estrutura.');
      }

      // Convert response nodes to FolderNode tree
      function convertNodes(nodes: any[]): FolderNode[] {
        return nodes.map((n, idx) => ({
          id: `ai-node-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: (n.name || 'Pasta').replace(/[\\/:*?"<>|]/g, '_'),
          tagColor: n.tag,
          isExpanded: true,
          children: n.children && n.children.length > 0 ? convertNodes(n.children) : [],
        }));
      }

      const newRoot: FolderNode = {
        id: `ai-root-${Date.now()}`,
        name: (data.rootName || baseName || 'Projeto_Organizado').replace(/[\\/:*?"<>|]/g, '_'),
        tagColor: 'purple',
        isExpanded: true,
        children: convertNodes(data.nodes || []),
      };

      onApplyStructure(newRoot);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível conectar com a IA no momento. Usando gerador alternativo.');
    } finally {
      setIsLoading(false);
    }
  };

  const PROMPT_SUGGESTIONS = [
    'Canal do YouTube de tecnologia com unboxings, roteiros e thumbnails',
    'Escritório de arquitetura com plantas DWG, renders 3D e licenças',
    'Consultório médico com prontuários anonimizados e exames',
    'Agência de marketing com campanhas de Google Ads e redes sociais',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950/60 to-neutral-900 px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Arquiteto de Pastas com Inteligência Artificial
              </h2>
              <p className="text-xs text-neutral-400">
                Descreva seu fluxo de trabalho e a IA cria a árvore de pastas ideal para macOS.
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nome da Pasta Principal:
            </label>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Ex: PROJETO_ARQUITETURA"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Descreva seu projeto ou profissão:
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Sou produtor musical e preciso organizar gravações de voz, beats, mixagem no Logic Pro, masters e contratos de direitos autorais..."
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500 custom-scrollbar"
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] text-neutral-400 flex items-center space-x-1 mb-2">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Sugestões rápidas para clicar:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => setPrompt(sug)}
                  className="text-[11px] text-neutral-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/5 transition text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/80 px-6 py-3 border-t border-white/10 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            id="btn-generate-ai-structure"
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center space-x-2 transition shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando Estrutura...</span>
              </>
            ) : (
              <>
                <span>Gerar com IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
