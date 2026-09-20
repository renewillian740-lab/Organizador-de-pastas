import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Trash2,
  Folder,
  RotateCcw,
  Clock,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { OrganizationResultSummary } from '../types/organizer';
import { clearHistory } from '../services/history';

interface HistoryViewProps {
  history: OrganizationResultSummary[];
  onRefreshHistory: () => void;
  onNavigateToOrganize: () => void;
}

export function HistoryView({
  history,
  onRefreshHistory,
  onNavigateToOrganize,
}: HistoryViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = () => {
    if (confirm('Tem certeza de que deseja apagar todo o histórico de organizações?')) {
      clearHistory();
      onRefreshHistory();
      setConfirmClear(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <Clock className="w-7 h-7 text-blue-400" />
            <span>HISTÓRICO</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Registro de todas as pastas e arquivos organizados no seu Mac.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Histórico</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto py-16">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="text-base font-semibold text-white">Nenhum histórico ainda</div>
            <p className="text-xs text-neutral-400 max-w-sm">
              Quando você organizar uma pasta, o resumo aparecerá registrado aqui.
            </p>
          </div>
          <button
            onClick={onNavigateToOrganize}
            className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-lg shadow-blue-500/20"
          >
            Organizar Minha Primeira Pasta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                  <Folder className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-neutral-400">
                    {item.dateFormatted} — {item.timeFormatted}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center space-x-2">
                    <span>{item.folderName}</span>
                    <span className="text-xs font-sans font-normal text-neutral-400">
                      ({item.modelTitle})
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 flex items-center space-x-3 font-mono pt-0.5">
                    <span>{item.totalProcessed} arquivos</span>
                    <span>•</span>
                    <span className="text-emerald-400">{item.organizedCount} organizados</span>
                    {item.errorsCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-400">{item.errorsCount} erros</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                {item.undone ? (
                  <span className="text-xs font-mono text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Desfeito</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>✓ Concluído</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
