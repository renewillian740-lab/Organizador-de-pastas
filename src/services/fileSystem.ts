import { FileItemInfo, PlannedFileMove, OrganizationResultSummary, OrganizationModelType } from '../types/organizer';
import { formatDateTimeNice } from './history';

/**
 * Checks if the browser natively supports File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Prompts user to pick a folder on Mac using showDirectoryPicker
 */
export async function pickFolderHandle(): Promise<{
  dirHandle: any;
  folderName: string;
  files: FileItemInfo[];
}> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('FILE_SYSTEM_NOT_SUPPORTED');
  }

  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'desktop',
  });

  const files: FileItemInfo[] = [];

  // Read files in root of selected folder
  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (handle.kind === 'file') {
      // Ignore hidden macOS files (.DS_Store, etc.)
      if (name.startsWith('.') || name === 'Thumbs.db') continue;

      try {
        const fileObj = await handle.getFile();
        files.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          size: fileObj.size,
          lastModified: fileObj.lastModified,
          type: fileObj.type,
          handle,
          fileObject: fileObj,
          relativePath: name,
        });
      } catch (e) {
        console.warn('Não foi possível ler arquivo:', name, e);
      }
    }
  }

  return {
    dirHandle,
    folderName: dirHandle.name,
    files,
  };
}

/**
 * Extracts FileItemInfo from an HTML input[webkitdirectory] or drag and drop FileList
 */
export async function scanFileList(fileList: FileList | File[]): Promise<{
  folderName: string;
  files: FileItemInfo[];
}> {
  const files: FileItemInfo[] = [];
  let rootFolderName = 'PASTA_SELECIONADA';

  const items = Array.from(fileList);

  for (const file of items) {
    if (file.name.startsWith('.') || file.name === 'Thumbs.db') continue;

    // Detect folder name from webkitRelativePath
    if ((file as any).webkitRelativePath) {
      const parts = (file as any).webkitRelativePath.split('/');
      if (parts.length > 1) {
        rootFolderName = parts[0];
      }
    }

    files.push({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type,
      fileObject: file,
      relativePath: file.name,
    });
  }

  return {
    folderName: rootFolderName,
    files,
  };
}

/**
 * Recursively scans dropped items from a DragEvent.
 * Fully supports:
 * 1. FileSystemDirectoryHandle via item.getAsFileSystemHandle() (Mac Chrome / Chromium)
 * 2. FileSystemDirectoryEntry via item.webkitGetAsEntry() (Safari, Firefox, Chrome fallback)
 * 3. Regular dropped FileList
 */
export async function scanDroppedItems(dataTransfer: DataTransfer): Promise<{
  folderName: string;
  files: FileItemInfo[];
  dirHandle: any | null;
}> {
  // 1. Try getAsFileSystemHandle (modern Mac Chrome / Chromium)
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind !== 'file') continue;

      if (typeof (item as any).getAsFileSystemHandle === 'function') {
        try {
          const handle = await (item as any).getAsFileSystemHandle();
          if (handle && handle.kind === 'directory') {
            const files: FileItemInfo[] = [];
            for await (const [name, child] of (handle as any).entries()) {
              if (child.kind === 'file') {
                if (name.startsWith('.') || name === 'Thumbs.db') continue;
                try {
                  const fileObj = await child.getFile();
                  files.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    name,
                    size: fileObj.size,
                    lastModified: fileObj.lastModified,
                    type: fileObj.type,
                    handle: child,
                    fileObject: fileObj,
                    relativePath: name,
                  });
                } catch (e) {
                  console.warn('Erro ao ler arquivo do handle:', name, e);
                }
              }
            }

            if (files.length > 0) {
              return {
                folderName: handle.name,
                files,
                dirHandle: handle,
              };
            }
          }
        } catch (err) {
          console.warn('getAsFileSystemHandle falhou, tentando fallback por entry:', err);
        }
      }
    }
  }

  // 2. Fallback: webkitGetAsEntry (universal directory reader across browsers)
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const rawFiles: File[] = [];
    let detectedFolderName = '';

    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind !== 'file') continue;

      const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
      if (entry) {
        if (entry.isDirectory) {
          if (!detectedFolderName) detectedFolderName = entry.name;
          const dirFiles = await readAllFilesFromEntry(entry);
          rawFiles.push(...dirFiles);
        } else if (entry.isFile) {
          const file = await getFileFromEntry(entry);
          if (file) rawFiles.push(file);
        }
      } else {
        const file = item.getAsFile();
        if (file) rawFiles.push(file);
      }
    }

    if (rawFiles.length > 0) {
      const files: FileItemInfo[] = [];
      for (const f of rawFiles) {
        if (f.name.startsWith('.') || f.name === 'Thumbs.db') continue;
        files.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
          type: f.type,
          fileObject: f,
          relativePath: (f as any).webkitRelativePath || f.name,
        });
      }

      return {
        folderName: detectedFolderName || 'PASTA_ARRASTADA',
        files,
        dirHandle: null,
      };
    }
  }

  // 3. Fallback: dataTransfer.files
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    const res = await scanFileList(dataTransfer.files);
    return {
      folderName: res.folderName,
      files: res.files,
      dirHandle: null,
    };
  }

  return {
    folderName: '',
    files: [],
    dirHandle: null,
  };
}

async function readAllFilesFromEntry(entry: any, basePath = ''): Promise<File[]> {
  if (!entry) return [];
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (f: File) => {
          const relPath = basePath ? `${basePath}/${f.name}` : f.name;
          try {
            Object.defineProperty(f, 'webkitRelativePath', {
              value: relPath,
              configurable: true,
            });
          } catch (e) {
            // ignore
          }
          resolve([f]);
        },
        () => resolve([])
      );
    });
  }

  if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const childEntries: any[] = [];

    await new Promise<void>((resolve) => {
      function readBatch() {
        dirReader.readEntries(
          (batch: any[]) => {
            if (!batch || batch.length === 0) {
              resolve();
            } else {
              childEntries.push(...batch);
              readBatch();
            }
          },
          () => resolve()
        );
      }
      readBatch();
    });

    const results: File[] = [];
    const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    for (const child of childEntries) {
      if (child.name.startsWith('.') || child.name === 'Thumbs.db') continue;
      const childFiles = await readAllFilesFromEntry(child, currentPath);
      results.push(...childFiles);
    }
    return results;
  }

  return [];
}

async function getFileFromEntry(entry: any): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (f: File) => resolve(f),
      () => resolve(null)
    );
  });
}

/**
 * Helper to find safe, non-colliding file name:
 * video.mp4 -> video (1).mp4 -> video (2).mp4
 */
async function getUniqueFileNameInDirectory(dirHandle: any, originalName: string): Promise<string> {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';

  let candidateName = originalName;
  let counter = 1;

  while (true) {
    try {
      // Check if file exists in target directory
      await dirHandle.getFileHandle(candidateName);
      // If no error, file exists! Generate next increment
      candidateName = `${baseName} (${counter})${ext}`;
      counter++;
    } catch (err: any) {
      // If error is NotFoundError, candidateName is free!
      if (err.name === 'NotFoundError') {
        return candidateName;
      }
      // If any other permission error, fallback to candidate
      return candidateName;
    }
  }
}

/**
 * Executes the planned file moves inside the chosen directory handle
 */
export async function executeOrganizationMoves(
  rootHandle: any,
  plannedMoves: PlannedFileMove[],
  modelUsed: OrganizationModelType,
  modelTitle: string,
  onProgress: (current: number, total: number, fileName: string, targetFolder: string) => void
): Promise<OrganizationResultSummary> {
  const total = plannedMoves.length;
  let organizedCount = 0;
  let ignoredCount = 0;
  const errors: Array<{ fileName: string; reason: string }> = [];
  const movedFilesLog: Array<{
    fileName: string;
    originalRelativePath: string;
    newRelativePath: string;
    fileHandle?: any;
    targetDirHandle?: any;
  }> = [];

  // If rootHandle is provided, verify/request readwrite permission
  if (rootHandle && typeof rootHandle.queryPermission === 'function') {
    try {
      const q = await rootHandle.queryPermission({ mode: 'readwrite' });
      if (q !== 'granted') {
        const r = await rootHandle.requestPermission({ mode: 'readwrite' });
        if (r !== 'granted') {
          throw new Error('Permissão de gravação na pasta necessária para mover arquivos no Mac.');
        }
      }
    } catch (permErr: any) {
      console.warn('Verificação de permissão:', permErr);
    }
  }

  for (let i = 0; i < total; i++) {
    const move = plannedMoves[i];
    onProgress(i + 1, total, move.file.name, move.targetFolder);

    try {
      // If file has no handle (e.g. dropped via input without directory access), we record as simulation/preview
      if (!move.file.handle) {
        organizedCount++;
        continue;
      }

      // Navigate / create subfolders recursively
      let currentDir = rootHandle;
      for (const sub of move.targetSubfolders) {
        currentDir = await currentDir.getDirectoryHandle(sub, { create: true });
      }

      // Handle duplicate names safely
      const uniqueName = await getUniqueFileNameInDirectory(currentDir, move.file.name);

      // Attempt native move if supported
      const sourceHandle = move.file.handle;
      if (typeof sourceHandle.move === 'function') {
        await sourceHandle.move(currentDir, uniqueName);
      } else {
        // Fallback: Copy content then remove source
        const fileData = await sourceHandle.getFile();
        const targetHandle = await currentDir.getFileHandle(uniqueName, { create: true });
        const writable = await targetHandle.createWritable();
        await writable.write(fileData);
        await writable.close();

        // Safely remove original from root
        await rootHandle.removeEntry(move.file.name);
      }

      organizedCount++;
      movedFilesLog.push({
        fileName: uniqueName,
        originalRelativePath: move.file.name,
        newRelativePath: `${move.targetFolder}/${uniqueName}`,
        fileHandle: sourceHandle,
        targetDirHandle: currentDir,
      });
    } catch (err: any) {
      console.error(`Erro ao organizar arquivo ${move.file.name}:`, err);
      errors.push({
        fileName: move.file.name,
        reason: err?.message || 'Permissão negada ou arquivo em uso',
      });
    }
  }

  const { dateFormatted, timeFormatted } = formatDateTimeNice();

  return {
    id: `org-${Date.now()}`,
    folderName: rootHandle?.name || 'Pasta',
    totalProcessed: total,
    organizedCount,
    ignoredCount,
    errorsCount: errors.length,
    modelUsed,
    modelTitle,
    timestamp: Date.now(),
    dateFormatted,
    timeFormatted,
    errors,
    movedFilesLog,
    canUndo: movedFilesLog.length > 0,
  };
}

/**
 * Safely undoes an organization move by moving files back to the root directory
 */
export async function executeUndoMoves(
  rootHandle: any,
  log: Array<{
    fileName: string;
    originalRelativePath: string;
    newRelativePath: string;
    fileHandle?: any;
    targetDirHandle?: any;
  }>
): Promise<{ success: boolean; revertedCount: number; errors: string[] }> {
  let revertedCount = 0;
  const errors: string[] = [];

  for (const item of log) {
    try {
      if (!item.targetDirHandle) continue;

      const fileHandle = await item.targetDirHandle.getFileHandle(item.fileName);
      const safeRootName = await getUniqueFileNameInDirectory(rootHandle, item.originalRelativePath);

      if (typeof fileHandle.move === 'function') {
        await fileHandle.move(rootHandle, safeRootName);
      } else {
        const fileData = await fileHandle.getFile();
        const newRootHandle = await rootHandle.getFileHandle(safeRootName, { create: true });
        const writable = await newRootHandle.createWritable();
        await writable.write(fileData);
        await writable.close();

        await item.targetDirHandle.removeEntry(item.fileName);
      }

      revertedCount++;
    } catch (err: any) {
      console.error('Erro ao desfazer arquivo:', item.fileName, err);
      errors.push(`${item.fileName}: ${err?.message || 'Falha ao reverter'}`);
    }
  }

  return {
    success: errors.length === 0,
    revertedCount,
    errors,
  };
}

/**
 * Generates and triggers download of a macOS .command Terminal script
 * which moves all files into their respective subfolders in 1 click
 */
export function downloadMacOrganizeScript(folderName: string, plannedMoves: PlannedFileMove[]) {
  const safeFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'pasta';
  const lines = [
    '#!/bin/bash',
    '# =========================================================',
    '# Script de Organização Automática para macOS',
    `# Pasta Alvo: ${folderName}`,
    '# =========================================================',
    'cd "$(dirname "$0")" || exit 1',
    '',
    'echo ""',
    'echo "🍎 Organizando seus arquivos no Mac..."',
    'echo ""',
    '',
  ];

  // Create unique subfolders
  const uniqueFolders = Array.from(
    new Set(plannedMoves.map((m) => m.targetFolder).filter(Boolean))
  );

  for (const f of uniqueFolders) {
    lines.push(`mkdir -p "${f}"`);
  }
  lines.push('');

  // Move files
  for (const move of plannedMoves) {
    if (move.targetFolder) {
      lines.push(`if [ -f "${move.file.name}" ]; then`);
      lines.push(`  mv -n "${move.file.name}" "${move.targetFolder}/"`);
      lines.push('fi');
    }
  }

  lines.push('');
  lines.push('echo ""');
  lines.push('echo "✅ Todos os arquivos foram organizados com sucesso!"');
  lines.push('echo "Pressione Enter para encerrar..."');
  lines.push('read -r');
  lines.push('exit 0');

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'application/x-sh' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `organizar_${safeFolderName}.command`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
