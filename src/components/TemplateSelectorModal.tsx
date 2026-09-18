import { useState } from 'react';
import {
  X,
  Check,
  Video,
  Camera,
  Palette,
  Code,
  Briefcase,
  Receipt,
  Mic,
  FolderTree,
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../data/templates';
import { PresetTemplate, TemplateCategory } from '../types';
import { calculateFolderStats } from '../utils/macFolderUtils';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PresetTemplate) => void;
  currentTemplateId?: string;
}

const ICON_MAP: Record<string, any> = {
  Video,
  Camera,
  Palette,
  Code,
  Briefcase,
  Receipt,
  Mic,
  FolderTree,
};

export function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId,
}: TemplateSelectorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');

  if (!isOpen) return null;

  const filteredTemplates = PRESET_TEMPLATES.filter((tpl) => {
    if (selectedCategory === 'all') return true;
    return tpl.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-neutral-800/80 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Modelos Profissionais de Pastas para Mac
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Escolha uma arquitetura de pastas pronta e testada por criadores e empresas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-6 py-3 border-b border-white/10 bg-black/30 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todos os Modelos' },
            { id: 'video', label: 'Vídeo & YouTube' },
            { id: 'photo', label: 'Fotografia' },
            { id: 'design', label: 'Design & UI' },
            { id: 'dev', label: 'Desenvolvimento' },
            { id: 'business', label: 'Negócios / Clientes' },
            { id: 'finance', label: 'Finanças' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as TemplateCategory)}
              className={`px-3 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid of Templates */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {filteredTemplates.map((template) => {
            const Icon = ICON_MAP[template.iconName] || FolderTree;
            const stats = calculateFolderStats(template.rootFolder);
            const isSelected = currentTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/40'
                    : 'bg-neutral-800/40 border-white/10 hover:border-white/25 hover:bg-neutral-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30 font-medium">
                        <Check className="w-3 h-3" />
                        <span>Ativo</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-white text-sm group-hover:text-blue-300 transition">
                    {template.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono text-neutral-300">
                    {stats.totalFolders} pastas no total
                  </span>
                  <span className="text-blue-400 group-hover:underline">Carregar Modelo &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
