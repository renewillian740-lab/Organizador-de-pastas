import { useState } from 'react';
import { Copy, Check, Download, Apple } from 'lucide-react';
import { FolderNode } from '../types';
import {
  generateMacShellScript,
  downloadTextFile,
  calculateFolderStats,
} from '../utils/macFolderUtils';

interface MacTerminalViewProps {
  rootFolder: FolderNode;
  onOpenDirectModal: () => void;
}

export function MacTerminalView({ rootFolder, onOpenDirectModal }: MacTerminalViewProps) {
  const [targetFolder, setTargetFolder] = useState<'Desktop' | 'Documents' | 'Downloads'>('Desktop');
  const [copied, setCopied] = useState(false);

  const stats = calculateFolderStats(rootFolder);
  const scriptContent = generateMacShellScript(rootFolder, targetFolder);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `Criar_${rootFolder.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.command`;
    downloadTextFile(scriptContent, filename);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="bg-[#1e1e24] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          <span className="text-neutral-400 font-mono text-[11px] ml-2">
            macOS Terminal — bash (80x24)
          </span>
        </div>

        {/* Target directory selector */}
        <div className="flex items-center space-x-2">
          <span className="text-neutral-400 text-[11px]">Destino no Mac:</span>
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-neutral-200 text-[11px] focus:outline-none"
          >
            <option value="Desktop">~/Desktop (Mesa)</option>
            <option value="Documents">~/Documents (Documentos)</option>
            <option value="Downloads">~/Downloads</option>
          </select>
        </div>
      </div>

      {/* Terminal Command Preview */}
      <div className="flex-1 p-4 font-mono text-xs text-neutral-200 bg-black/90 overflow-y-auto custom-scrollbar">
        <div className="text-emerald-400 mb-2 flex items-center space-x-1.5">
          <span>macbook-pro:~ usuario$</span>
          <span className="text-neutral-300"># Visualização do Script Gerador</span>
        </div>
        <pre className="text-[12px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white">
          {scriptContent}
        </pre>
      </div>

      {/* Action Footer */}
      <div className="bg-[#1a1a20] p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-neutral-400">
          <Apple className="w-4 h-4 text-white" />
          <span>
            {stats.totalFolders} pastas serão criadas automaticamente em <strong>~/{targetFolder}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-md shadow-blue-500/20"
            title="Baixa o arquivo .command para executar no Mac com 2 cliques"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Arquivo .command</span>
          </button>

          <button
            onClick={onOpenDirectModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md shadow-emerald-500/20"
          >
            <span>Criar Agora Direto no Mac &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
