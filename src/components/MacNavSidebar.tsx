import {
  LayoutDashboard,
  FolderTree,
  Clock,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export type MainNavSection = 'inicio' | 'organizar' | 'historico' | 'configuracoes';

interface MacNavSidebarProps {
  currentSection: MainNavSection;
  onSelectSection: (section: MainNavSection) => void;
  historyCount: number;
}

export function MacNavSidebar({
  currentSection,
  onSelectSection,
  historyCount,
}: MacNavSidebarProps) {
  const navItems = [
    {
      id: 'inicio' as MainNavSection,
      label: 'INÍCIO',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'organizar' as MainNavSection,
      label: 'ORGANIZAR',
      icon: FolderTree,
      badge: null,
    },
    {
      id: 'historico' as MainNavSection,
      label: 'HISTÓRICO',
      icon: Clock,
      badge: historyCount > 0 ? historyCount : null,
    },
    {
      id: 'configuracoes' as MainNavSection,
      label: 'CONFIGURAÇÕES',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <aside className="w-56 bg-neutral-950/70 border-r border-white/10 flex flex-col justify-between p-3 select-none flex-shrink-0">
      <div className="space-y-4">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 space-y-1 text-[11px] text-neutral-500">
        <div className="flex items-center space-x-1.5 text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[10px] uppercase tracking-wider">Local & Seguro</span>
        </div>
        <p className="text-[10px] leading-tight text-neutral-500">
          Arquivos processados no Mac sem upload.
        </p>
      </div>
    </aside>
  );
}
