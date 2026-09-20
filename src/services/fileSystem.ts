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
