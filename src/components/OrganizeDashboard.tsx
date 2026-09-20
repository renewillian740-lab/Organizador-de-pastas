import { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Calendar,
  Film,
  Receipt,
  Sliders,
  Plus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  File,
  ChevronDown,
  ChevronRight,
  Upload,
} from 'lucide-react';
import {
  FileItemInfo,
  OrganizationModelType,
  OrganizationPreviewData,
  OrganizationResultSummary,
  CustomFileRule,
} from '../types/organizer';
import {
  isFileSystemAccessSupported,
  pickFolderHandle,
  scanFileList,
  scanDroppedItems,
  downloadMacOrganizeScript,
  executeOrganizationMoves,
  executeUndoMoves,
} from '../services/fileSystem';
import { ORGANIZATION_MODELS, planOrganization } from '../services/organization';
import { addHistoryEntry, markHistoryItemAsUndone } from '../services/history';

import { FolderNode } from '../types';

interface OrganizeDashboardProps {
  customRules: CustomFileRule[];
  projectRootFolder?: FolderNode;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onNavigateToProjects?: () => void;
}

export function OrganizeDashboard({
  customRules,
  projectRootFolder,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToProjects,
}: OrganizeDashboardProps) {
  // Step state: 'select_folder' | 'select_model' | 'preview' | 'executing' | 'result'
  const [step, setStep] = useState<'select_folder' | 'select_model' | 'preview' | 'executing' | 'result'>('select_folder');

  // Selected folder and files state
  const [folderName, setFolderName] = useState<string>('');
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [scannedFiles, setScannedFiles] = useState<FileItemInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Model selection (defaults to project_template - MEUS PROJETOS)
  const [selectedModel, setSelectedModel] = useState<OrganizationModelType>('project_template');

  // Preview data
  const [previewData, setPreviewData] = useState<OrganizationPreviewData | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Execution & progress
  const [progressCount, setProgressCount] = useState(0);
  const [currentFileProcessing, setCurrentFileProcessing] = useState('');
  const [currentTargetProcessing, setCurrentTargetProcessing] = useState('');

  // Result state
  const [resultSummary, setResultSummary] = useState<OrganizationResultSummary | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Pick folder with File System Access API
  const handleSelectFolder = async () => {
    setScanError(null);
    setIsScanning(true);
    try {
      if (isFileSystemAccessSupported()) {
        const result = await pickFolderHandle();
        if (result.files.length === 0) {
          setScanError(`A pasta "${result.folderName}" está vazia ou não contém arquivos soltos para organizar.`);
          setIsScanning(false);
          return;
        }
        setDirHandle(result.dirHandle);
        setFolderName(result.folderName);
        setScannedFiles(result.files);
        setStep('select_model');
      } else {
        // Fallback to webkitdirectory input
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setScanError(err?.message || 'Não foi possível acessar a pasta selecionada.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setScanError(null);
    setIsScanning(true);

    try {
      const result = await scanDroppedItems(e.dataTransfer);
      if (result.files.length === 0) {
        setScanError('Nenhum arquivo encontrado na pasta arrastada. Se preferir, clique em "SELECIONAR PASTA" para escolher diretamente.');
        setIsScanning(false);
        return;
      }

      setFolderName(result.folderName || 'PASTA_ARRASTADA');
      setScannedFiles(result.files);
      setDirHandle(result.dirHandle);
      setStep('select_model');
    } catch (err: any) {
      console.error('Erro ao processar arrastar pasta:', err);
      setScanError(err?.message || 'Erro ao ler a pasta arrastada.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      try {
        const result = await scanFileList(e.target.files);
        setFolderName(result.folderName);
        setScannedFiles(result.files);
        setStep('select_model');
      } catch (err: any) {
        setScanError('Erro ao carregar arquivos da pasta selecionada.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  // 2. Select model & advance to Preview
  const handleProceedToPreview = (modelId: OrganizationModelType) => {
    setSelectedModel(modelId);
    const planned = planOrganization(scannedFiles, modelId, customRules, projectRootFolder);
    setPreviewData(planned);

    // Expand all folders by default in preview
    const initialExpanded: Record<string, boolean> = {};
    for (const folder of planned.foldersToCreate) {
      initialExpanded[folder] = true;
    }
    setExpandedFolders(initialExpanded);
    setStep('preview');
  };

  // 3. Execute Organization
  const handleStartOrganization = async () => {
    if (!previewData) return;

    if (!dirHandle && isFileSystemAccessSupported()) {
      // If handle is missing, guide the user to select the folder in Finder to move directly
      await handleSelectFolderAndExecute();
      return;
    }

    setStep('executing');
    setProgressCount(0);

    const modelObj = ORGANIZATION_MODELS.find((m) => m.id === selectedModel);
    const modelTitle = modelObj ? modelObj.title : 'Personalizado';

    try {
      const result = await executeOrganizationMoves(
        dirHandle,
        previewData.plannedMoves,
        selectedModel,
        modelTitle,
        (current, _total, fileName, targetFolder) => {
          setProgressCount(current);
          setCurrentFileProcessing(fileName);
          setCurrentTargetProcessing(targetFolder);
        }
      );

      setResultSummary(result);
      addHistoryEntry(result);
      setStep('result');
    } catch (err: any) {
      console.error(err);
      setScanError(err?.message || 'Ocorreu um erro durante a organização dos arquivos.');
      setStep('select_model');
    }
  };

  const handleSelectFolderAndExecute = async () => {
    if (!previewData) return;
    try {
      const picked = await pickFolderHandle();
      setDirHandle(picked.dirHandle);
      setFolderName(picked.folderName);

      setStep('executing');
      setProgressCount(0);

      const modelObj = ORGANIZATION_MODELS.find((m) => m.id === selectedModel);
      const modelTitle = modelObj ? modelObj.title : 'Personalizado';

      // Match files with native handle
      const movesWithHandles = previewData.plannedMoves.map((m) => {
        const matching =
          picked.files.find((pf) => pf.relativePath === m.file.relativePath) ||
          picked.files.find((pf) => pf.name === m.file.name);
        return {
          ...m,
          file: {
            ...m.file,
            handle: matching?.handle || m.file.handle,
            parentDirHandle: matching?.parentDirHandle || m.file.parentDirHandle,
            relativePath: matching?.relativePath || m.file.relativePath,
          },
        };
      });

      const result = await executeOrganizationMoves(
        picked.dirHandle,
        movesWithHandles,
        selectedModel,
        modelTitle,
        (current, _total, fileName, targetFolder) => {
          setProgressCount(current);
          setCurrentFileProcessing(fileName);
          setCurrentTargetProcessing(targetFolder);
        }
      );

      setResultSummary(result);
      addHistoryEntry(result);
      setStep('result');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        alert(err?.message || 'Não foi possível conceder permissão à pasta.');
      }
    }
  };

  // 4. Undo Organization
  const handleUndo = async () => {
    if (!resultSummary || !resultSummary.movedFilesLog || !dirHandle) return;
    setIsUndoing(true);
    setUndoMessage(null);

    try {
      const undoResult = await executeUndoMoves(dirHandle, resultSummary.movedFilesLog);
      if (undoResult.success) {
        setUndoMessage(`Desfeito com sucesso! ${undoResult.revertedCount} arquivos retornaram à raiz.`);
        markHistoryItemAsUndone(resultSummary.id);
        setResultSummary((prev) => (prev ? { ...prev, canUndo: false, undone: true } : null));
      } else {
        setUndoMessage(`Aviso: ${undoResult.errors.join(', ')}`);
      }
    } catch (err: any) {
      setUndoMessage(`Erro ao desfazer: ${err?.message || 'Falha ao reverter'}`);
    } finally {
      setIsUndoing(false);
    }
  };

  // 5. Open / Reveal folder
  const handleOpenFolder = () => {
    alert(
      `Sua pasta "${folderName}" foi organizada com sucesso no seu Mac!\n\nVocê pode abrir o Finder ou clicar na pasta correspondente no Mac para visualizar os arquivos organizados.`
    );
  };

  // Reset to initial screen
  const handleResetToNew = () => {
    setStep('select_folder');
    setFolderName('');
    setDirHandle(null);
    setScannedFiles([]);
    setPreviewData(null);
    setResultSummary(null);
    setUndoMessage(null);
  };

  const toggleFolderExpand = (fPath: string) => {
    setExpandedFolders((prev) => ({ ...prev, [fPath]: !prev[fPath] }));
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* Hidden input for folder picking fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        {...({ webkitdirectory: '', directory: '' } as any)}
        multiple
        className="hidden"
      />

      {/* ========================================================== */}
      {/* STEP 1: DASHBOARD / TELA INICIAL                           */}
      {/* ========================================================== */}
      {step === 'select_folder' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto py-8">
          <div className="space-y-3 max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              ORGANIZE SEUS ARQUIVOS<br />
              <span className="text-blue-400">EM SEGUNDOS.</span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Selecione uma pasta, escolha como deseja organizar seus arquivos e deixe o aplicativo fazer o trabalho.
            </p>
          </div>

          {/* Large Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectFolder}
            className={`w-full max-w-lg p-10 sm:p-14 rounded-2xl border-2 border-dashed transition duration-200 cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              isScanning
                ? 'border-blue-500 bg-blue-500/10'
                : isDragging
                ? 'border-blue-400 bg-blue-500/20 scale-[1.02] shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/20'
                : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25'
            }`}
          >
            {isScanning ? (
              <div className="flex flex-col items-center space-y-3 py-2">
                <div className="w-12 h-12 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-bold text-white tracking-wide">
                  LENDO ARQUIVOS DA PASTA...
                </div>
                <div className="text-xs text-neutral-400 max-w-xs">
                  Aguarde um instante enquanto mapeamos todos os arquivos.
                </div>
              </div>
            ) : isDragging ? (
              <div className="flex flex-col items-center space-y-3 py-2 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/30 border border-blue-400 flex items-center justify-center text-blue-300 shadow-lg">
                  <Upload className="w-7 h-7 animate-bounce" />
                </div>
                <div className="text-base font-bold text-white tracking-wide">
                  SOLTE A PASTA AQUI
                </div>
                <div className="text-xs text-blue-300">
                  Os arquivos serão lidos e organizados automaticamente
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 text-2xl shadow-inner">
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm sm:text-base font-semibold tracking-wider text-white uppercase">
                    ARRASTE UMA PASTA AQUI
                  </div>
                  <div className="text-xs text-neutral-400">
                    ou clique no botão abaixo para escolher do seu Mac
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFolder();
                  }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center space-x-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>SELECIONAR PASTA</span>
                </button>
              </>
            )}
          </div>

          {scanError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center space-x-2 max-w-md">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          <div className="text-[11px] text-neutral-400 flex items-center space-x-2 pt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nenhum arquivo é enviado para a internet. 100% local e seguro no seu Mac.</span>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 2: MODELOS DE ORGANIZAÇÃO                             */}
      {/* ========================================================== */}
      {step === 'select_model' && (
        <div className="flex-1 flex flex-col space-y-6 max-w-3xl mx-auto w-full py-4">
          {/* Header bar with chosen folder */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] border border-white/10 p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                  Pasta Selecionada
                </div>
                <div className="text-sm font-semibold text-white font-mono flex items-center space-x-2">
                  <span>{folderName}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    {scannedFiles.length} arquivos
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('select_folder')}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition"
            >
              Trocar Pasta
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              COMO VOCÊ QUER ORGANIZAR?
            </h2>
            <p className="text-xs text-neutral-400">
              Escolha um modelo para aplicar regras inteligentes de separação de arquivos.
            </p>
          </div>

          {/* Model Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ORGANIZATION_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => handleProceedToPreview(model.id)}
                  className={`text-left p-4 sm:p-5 rounded-2xl border transition group relative flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="text-2xl">{model.icon}</div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                      {model.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wider flex items-center space-x-1.5">
                      <span>{model.title}</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  <div className="text-xs font-medium text-blue-400 flex items-center space-x-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver prévia</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom rules hint */}
          <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs flex items-center justify-between">
            <span className="text-neutral-400">
              Deseja editar extensões e pastas personalizadas?
            </span>
            <button
              onClick={onNavigateToSettings}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustar Regras</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 3: PRÉVIA DA ORGANIZAÇÃO                             */}
      {/* ========================================================== */}
      {step === 'preview' && previewData && (
        <div className="flex-1 flex flex-col space-y-5 max-w-3xl mx-auto w-full py-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                PRÉVIA DA ORGANIZAÇÃO
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Encontramos <strong className="text-white font-mono">{previewData.totalFiles} arquivos</strong> na pasta <span className="text-blue-400 font-mono">"{folderName}"</span>
              </p>
            </div>

            <button
              onClick={() => setStep('select_model')}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trocar Modelo</span>
            </button>
          </div>

          {/* Stat metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                ARQUIVOS:
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">
                {previewData.totalFiles}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                PASTAS A CRIAR:
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-400 font-mono mt-0.5">
                {previewData.foldersToCreate.length}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                ARQUIVOS SEM REGRA:
              </div>
              <div className="text-xl sm:text-2xl font-bold text-neutral-400 font-mono mt-0.5">
                {previewData.filesWithoutRule}
              </div>
            </div>
          </div>

          {/* Informative alert when Premiere projects or auto-saves are detected */}
          {previewData.hasPremiereProjects && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 flex items-start space-x-3 text-xs">
              <span className="text-base leading-none">🎬</span>
              <div className="flex-1 text-neutral-300">
                <span className="font-semibold text-purple-300">Projeto do Premiere / After Effects Preservado:</span>
                <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                  Detectamos <strong className="text-white">{previewData.premiereFilesCount}</strong> arquivo(s) vinculados ao projeto do Premiere (Auto-Saves, Video/Audio Previews e Caches). Eles foram mantidos intactos dentro de <span className="font-mono text-purple-300">01_PROJETOS</span> e não serão espalhados em pastas de footage ou áudio.
                </p>
              </div>
            </div>
          )}

          {/* Tree preview of planned folder structure */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col space-y-3 max-h-[380px] overflow-hidden">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>ESTRUTURA RESULTANTE</span>
              <span className="text-[11px] font-mono text-neutral-400">
                {previewData.foldersToCreate.length} diretórios planejados
              </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
              {previewData.foldersToCreate.map((folderPath) => {
                const filesInFolder = previewData.treeStructure[folderPath] || [];
                const isExpanded = expandedFolders[folderPath];

                return (
                  <div
                    key={folderPath}
                    className="border border-white/5 rounded-xl bg-white/[0.02] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFolderExpand(folderPath)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                        <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-white font-mono truncate">
                          {folderPath}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                        {filesInFolder.length} arquivos
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-2 border-t border-white/5 bg-black/20 space-y-1">
                        {filesInFolder.map((fname, i) => (
                          <div
                            key={i}
                            className="flex items-center space-x-2 text-[11px] text-neutral-300 font-mono py-0.5 truncate pl-4 border-l border-white/10 ml-2"
                          >
                            <File className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span className="truncate">{fname}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setStep('select_model')}
              className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-neutral-300 text-xs sm:text-sm font-medium transition"
            >
              CANCELAR
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadMacOrganizeScript(folderName, previewData.plannedMoves)}
                className="px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-neutral-200 text-xs sm:text-sm font-medium transition flex items-center space-x-1.5"
                title="Baixar script executável para Mac Terminal (.command)"
              >
                <span>⚡ Script Mac (.command)</span>
              </button>

              <button
                onClick={handleStartOrganization}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>{dirHandle ? 'ORGANIZAR NO MAC AGORA' : 'SELECIONAR PASTA NO MAC E MOVER'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 4: EXECUÇÃO COM PROGRESSO REAL                        */}
      {/* ========================================================== */}
      {step === 'executing' && previewData && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto max-w-md mx-auto w-full py-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ORGANIZANDO SEUS ARQUIVOS...
            </h2>
            <p className="text-xs text-neutral-400">
              Movendo e separando seus arquivos com segurança.
            </p>
          </div>

          {/* Real progress bar */}
          <div className="w-full space-y-2">
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.round((progressCount / Math.max(previewData.totalFiles, 1)) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
              <span>
                {progressCount} de {previewData.totalFiles} arquivos
              </span>
              <span className="text-blue-400 font-semibold">
                {Math.round((progressCount / Math.max(previewData.totalFiles, 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Current file notification */}
          <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left space-y-1">
            <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
              Organizando:
            </div>
            <div className="text-xs font-mono text-white truncate">
              {currentFileProcessing || 'Iniciando...'}
            </div>
            <div className="text-[11px] font-mono text-blue-400 truncate">
              → {currentTargetProcessing || 'Criando pastas...'}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 5: RESULTADO                                          */}
      {/* ========================================================== */}
      {step === 'result' && resultSummary && (
        <div className="flex-1 flex flex-col space-y-6 max-w-2xl mx-auto w-full my-auto py-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ✓ ORGANIZAÇÃO CONCLUÍDA
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-mono">
              {resultSummary.totalProcessed} arquivos processados na pasta "{resultSummary.folderName}"
            </p>
          </div>

          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {resultSummary.organizedCount}
              </div>
              <div className="text-xs text-neutral-300 mt-0.5">organizados</div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-neutral-400 font-mono">
                {resultSummary.ignoredCount}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">ignorados</div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-neutral-400 font-mono">
                {resultSummary.errorsCount}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">erros</div>
            </div>
          </div>

          {/* Error display if any */}
          {resultSummary.errors.length > 0 && (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-red-300">
                {resultSummary.errors.length} arquivos não puderam ser organizados:
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                {resultSummary.errors.map((errItem, idx) => (
                  <div key={idx} className="text-[11px] font-mono text-red-400 flex items-center justify-between">
                    <span>{errItem.fileName}</span>
                    <span className="text-neutral-400">{errItem.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Undo message if triggered */}
          {undoMessage && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 text-center font-mono">
              {undoMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleOpenFolder}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>ABRIR PASTA</span>
              </button>

              <button
                onClick={handleResetToNew}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>NOVA ORGANIZAÇÃO</span>
              </button>

              <button
                onClick={onNavigateToHistory}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs sm:text-sm transition flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>VER HISTÓRICO</span>
              </button>
            </div>

            {/* Undo button */}
            {resultSummary.canUndo && !resultSummary.undone && (
              <button
                onClick={handleUndo}
                disabled={isUndoing}
                className="w-full py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition border border-red-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isUndoing ? 'animate-spin' : ''}`} />
                <span>{isUndoing ? 'Desfazendo...' : 'DESFAZER ÚLTIMA ORGANIZAÇÃO'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
