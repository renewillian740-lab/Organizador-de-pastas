import { useState } from 'react';
import { Layers, Calendar, Hash, Check } from 'lucide-react';
import { FolderNode } from '../types';

interface BatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseTemplateRoot: FolderNode;
  onApplyBatch: (newRoot: FolderNode) => void;
}

export function BatchGeneratorModal({
  isOpen,
  onClose,
  baseTemplateRoot,
  onApplyBatch,
}: BatchGeneratorModalProps) {
  const [batchMode, setBatchMode] = useState<'names' | 'months' | 'numbers'>('names');
  const [namesListText, setNamesListText] = useState(
    'Cliente_Alpha\nCliente_Beta\nCliente_Gamma\nCliente_Delta'
  );
  const [selectedYear, setSelectedYear] = useState('2026');
  const [numberPrefix, setNumberPrefix] = useState('Projeto_');
  const [numberStart, setNumberStart] = useState(1);
  const [numberEnd, setNumberEnd] = useState(10);
  const [rootBatchName, setRootBatchName] = useState('TODOS_OS_CLIENTES');

  if (!isOpen) return null;

  // Month names in Portuguese
  const MONTHS = [
    '01_Janeiro',
    '02_Fevereiro',
    '03_Marco',
    '04_Abril',
    '05_Maio',
    '06_Junho',
    '07_Julho',
    '08_Agosto',
    '09_Setembro',
    '10_Outubro',
    '11_Novembro',
    '12_Dezembro',
  ];

  // Helper to deep clone children of template
  const cloneChildren = (children?: FolderNode[]): FolderNode[] | undefined => {
    if (!children) return undefined;
    return children.map((c) => ({
      ...c,
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      children: cloneChildren(c.children),
    }));
  };

  const handleGenerate = () => {
    let generatedChildren: FolderNode[] = [];

    if (batchMode === 'names') {
      const lines = namesListText
        .split('\n')
        .map((l) => l.trim().replace(/[\\/:*?"<>|]/g, '_'))
        .filter(Boolean);

      generatedChildren = lines.map((name, i) => ({
        id: `batch-item-${i}-${Date.now()}`,
        name,
        tagColor: 'blue',
        isExpanded: false,
        children: cloneChildren(baseTemplateRoot.children),
      }));
    } else if (batchMode === 'months') {
      generatedChildren = MONTHS.map((month, i) => ({
        id: `month-${i}-${Date.now()}`,
        name: month,
        tagColor: 'orange',
        isExpanded: false,
        children: cloneChildren(baseTemplateRoot.children),
      }));
    } else if (batchMode === 'numbers') {
      const count = Math.min(50, Math.max(1, numberEnd - numberStart + 1));
      generatedChildren = Array.from({ length: count }).map((_, i) => {
        const num = numberStart + i;
        const formatted = num.toString().padStart(2, '0');
        return {
          id: `num-${i}-${Date.now()}`,
          name: `${numberPrefix}${formatted}`,
          tagColor: 'purple',
          isExpanded: false,
          children: cloneChildren(baseTemplateRoot.children),
        };
      });
    }

    const newRoot: FolderNode = {
      id: `batch-root-${Date.now()}`,
      name: rootBatchName.trim() || 'LOTE_MAC',
      tagColor: 'green',
      isExpanded: true,
      children: generatedChildren,
    };

    onApplyBatch(newRoot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-neutral-800/80 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Gerador Automático de Pastas em Lote
              </h2>
              <p className="text-xs text-neutral-400">
                Gere dezenas de pastas com a mesma subestrutura interna com um clique.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-6 space-y-5">
          {/* Main Parent Folder Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nome da Pasta Principal no Mac:
            </label>
            <input
              type="text"
              value={rootBatchName}
              onChange={(e) => setRootBatchName(e.target.value)}
              placeholder="Ex: CLIENTES_2026"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Batch Type Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              onClick={() => setBatchMode('names')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                batchMode === 'names'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lista de Nomes</span>
            </button>

            <button
              onClick={() => setBatchMode('months')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                batchMode === 'months'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>12 Meses (Ano)</span>
            </button>

            <button
              onClick={() => setBatchMode('numbers')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                batchMode === 'numbers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Sequência 01..N</span>
            </button>
          </div>

          {/* Mode 1: List of Names */}
          {batchMode === 'names' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Cole a lista de itens (um por linha):
              </label>
              <textarea
                rows={5}
                value={namesListText}
                onChange={(e) => setNamesListText(e.target.value)}
                placeholder="Exemplo:\nCocaCola\nNike\nNubank\nApple"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono custom-scrollbar"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Uma pasta será criada para cada linha, contendo automaticamente todos os
                subdiretórios da estrutura atual.
              </p>
            </div>
          )}

          {/* Mode 2: Months */}
          {batchMode === 'months' && (
            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Ano de Referência:
                </label>
                <input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-32 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-neutral-400 font-mono">
                {MONTHS.map((m) => (
                  <div key={m} className="bg-white/5 px-2 py-1 rounded">
                    📁 {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Numbers */}
          {batchMode === 'numbers' && (
            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Prefixo:</label>
                  <input
                    type="text"
                    value={numberPrefix}
                    onChange={(e) => setNumberPrefix(e.target.value)}
                    placeholder="Projeto_"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Início:</label>
                  <input
                    type="number"
                    min={1}
                    value={numberStart}
                    onChange={(e) => setNumberStart(parseInt(e.target.value) || 1)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Fim:</label>
                  <input
                    type="number"
                    max={50}
                    value={numberEnd}
                    onChange={(e) => setNumberEnd(parseInt(e.target.value) || 10)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">
                Gera de {numberPrefix}
                {numberStart.toString().padStart(2, '0')} até {numberPrefix}
                {numberEnd.toString().padStart(2, '0')} com a estrutura completa replicada dentro.
              </p>
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
            id="btn-apply-batch"
            onClick={handleGenerate}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 transition shadow-md shadow-blue-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar e Gerar Estrutura</span>
          </button>
        </div>
      </div>
    </div>
  );
}
