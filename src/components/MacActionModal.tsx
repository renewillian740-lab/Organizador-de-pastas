import { useState } from 'react';
import {
  X,
  Check,
  Copy,
  Download,
  Terminal,
  FolderSync,
  Archive,
  Apple,
  FileCode,
  AlertCircle,
  ExternalLink,
  Play,
} from 'lucide-react';
import { FolderNode } from '../types';
import {
  generateMacShellScript,
  generateZipArchive,
  downloadTextFile,
  calculateFolderStats,
} from '../utils/macFolderUtils';

interface MacActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootFolder: FolderNode;
}

export function MacActionModal({ isOpen, onClose, rootFolder }: MacActionModalProps) {
  // Check if we are inside an iframe (AI Studio preview iframe)
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL BEFORE ANY EARLY RETURN (Rules of Hooks)
  const [activeAction, setActiveAction] = useState<'script' | 'terminal' | 'zip' | 'direct'>('direct');
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadedScript, setDownloadedScript] = useState(false);
  const [isCreatingDirect, setIsCreatingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  if (!isOpen) return null;

  const stats = calculateFolderStats(rootFolder);
  const shellScript = generateMacShellScript(rootFolder, 'Desktop');

  // Download .command script (Executable on macOS by double clicking)
  const handleDownloadCommandScript = () => {
    const filename = `Criar_Pastas_${rootFolder.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.command`;
    downloadTextFile(shellScript, filename);
    setDownloadedScript(true);
  };

  // Download .zip archive
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await generateZipArchive(rootFolder);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rootFolder.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  // Copy bash command to clipboard
  const handleCopyBash = () => {
    navigator.clipboard.writeText(shellScript);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2500);
  };

  // Direct generation (when opened outside iframe)
  const handleDirectCreation = async () => {
    setIsCreatingDirect(true);
    setDirectError(null);
    setDirectSuccess(false);

    try {
      if (!('showDirectoryPicker' in window)) {
        throw new Error('Navegador não suporta a API de Acesso a Arquivos.');
      }
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });

      async function createRecursively(parentHandle: any, node: FolderNode) {
        if (node.enabled === false) return;
        const currentHandle = await parentHandle.getDirectoryHandle(node.name, { create: true });
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            await createRecursively(currentHandle, child);
          }
        }
      }

      await createRecursively(dirHandle, rootFolder);
      setDirectSuccess(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setDirectError('Seleção cancelada.');
      } else {
        setDirectError(err?.message || 'Erro ao criar pastas diretamente.');
      }
    } finally {
      setIsCreatingDirect(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-neutral-800/90 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner">
              🍏
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                <span>Criar no Mac</span>
                <span className="text-xs font-mono font-normal bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  {stats.totalFolders} pastas selecionadas
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Destino principal: <span className="text-white font-mono">{rootFolder.name}</span>
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

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/40 px-4 sm:px-6 pt-2 gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveAction('direct')}
            className={`pb-2.5 px-3 font-medium flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeAction === 'direct'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>Criador Direto no Mac ⭐</span>
          </button>

          <button
            onClick={() => setActiveAction('script')}
            className={`pb-2.5 px-3 font-medium flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              activeAction === 'script'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Arquivo Mac (.command)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* TAB 1: .COMMAND EXECUTABLE SCRIPT */}
          {activeAction === 'script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Método Mais Fácil e Seguro para Mac
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Baixe o arquivo <strong>.command</strong> abaixo. Ao dar <strong>2 cliques</strong> nele no seu Mac, ele cria as <strong>{stats.totalFolders} pastas</strong> na sua Mesa (Desktop) e abre o Finder automaticamente!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  id="btn-download-command-file"
                  onClick={handleDownloadCommandScript}
                  disabled={stats.totalFolders === 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Baixar Arquivo Executável para Mac (.command)</span>
                </button>

                {downloadedScript && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start space-x-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Arquivo baixado!</strong> Basta clicar duas vezes no arquivo baixado na sua pasta de Downloads do Mac para gerar todas as pastas.
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs text-neutral-400">
                <div className="font-semibold text-neutral-300">Como funciona:</div>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Clique no botão azul acima para baixar o arquivo.</li>
                  <li>Abra o arquivo baixado com 2 cliques.</li>
                  <li>Pronto! Todas as pastas selecionadas são criadas na sua Mesa (Desktop).</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: TERMINAL BASH */}
          {activeAction === 'terminal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-1.5">
                <h4 className="font-semibold text-white text-sm">Cole direto no Terminal do Mac:</h4>
                <p>
                  Abra o aplicativo <strong>Terminal</strong> (pressione <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Cmd + Espaço</kbd> e digite <em>Terminal</em>), cole o comando abaixo e pressione <strong>Enter</strong>:
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Comando bash pré-configurado:</span>
                  <button
                    onClick={handleCopyBash}
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    {copiedTerminal ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado com sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-black/90 border border-white/15 rounded-xl p-3.5 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-44 custom-scrollbar select-all">
                  {shellScript}
                </pre>

                <button
                  onClick={handleCopyBash}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Comando para o Terminal</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ZIP ARCHIVE */}
          {activeAction === 'zip' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 leading-relaxed space-y-2">
                <h4 className="font-semibold text-white text-sm">Download como Arquivo .ZIP</h4>
                <p>
                  Gera um arquivo <code>.zip</code> com toda a árvore das <strong>{stats.totalFolders} pastas</strong> selecionadas. Ao clicar duas vezes nele no Finder, o macOS descompacta a estrutura pronta instantaneamente.
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="btn-download-zip"
                  onClick={handleDownloadZip}
                  disabled={isZipping || stats.totalFolders === 0}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isZipping ? 'Compactando pastas...' : `Baixar Pacote .ZIP (${stats.totalFolders} pastas)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT FILE SYSTEM ACCESS */}
          {activeAction === 'direct' && (
            <div className="space-y-4">
              {isInsideIframe ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center space-x-2 font-semibold text-amber-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Por que o seletor nativo foi bloqueado?</span>
                    </div>
                    <p className="leading-relaxed">
                      Por segurança do navegador Chrome/macOS, seletores diretos de disco (<em>showDirectoryPicker</em>) não podem ser abertos dentro de janelas embutidas (iFrames) como este preview.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Para usar a criação direta nativa:</strong> abra o app em uma <strong>nova aba</strong> do navegador, ou use o <strong>Arquivo .command</strong> (que funciona direto no Mac com 2 cliques).
                    </p>
                  </div>

                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl text-xs border border-white/10 flex items-center justify-center space-x-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir App em Nova Aba para Usar Seletor Direto</span>
                  </a>

                  <button
                    onClick={() => setActiveAction('script')}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs shadow transition flex items-center justify-center space-x-2"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Usar Arquivo .command (Recomendado - 2 Cliques)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-neutral-300">
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Criação Nativa no Sistema de Arquivos
                    </h4>
                    <p>
                      Selecione a pasta de destino no seu Mac (ex: Mesa/Desktop). As <strong>{stats.totalFolders} pastas</strong> selecionadas serão criadas diretamente no seu disco.
                    </p>
                  </div>

                  {directSuccess && (
                    <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Todas as pastas foram criadas com sucesso no seu Mac!</span>
                    </div>
                  )}

                  {directError && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{directError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleDirectCreation}
                    disabled={isCreatingDirect || stats.totalFolders === 0}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition"
                  >
                    <span>📁</span>
                    <span>{isCreatingDirect ? 'Criando...' : 'Escolher Pasta no Mac & Criar'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/60 px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center space-x-1.5">
            <Apple className="w-3.5 h-3.5 text-neutral-300" />
            <span>Criador Automático de Pastas para macOS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
