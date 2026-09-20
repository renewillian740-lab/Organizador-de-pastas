export type OrganizationModelType =
  | 'project_template'
  | 'client'
  | 'date'
  | 'project'
  | 'invoices'
  | 'custom';

export interface FileItemInfo {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  type: string;
  handle?: any; // FileSystemFileHandle if available
  fileObject?: File;
  relativePath?: string;
  parentDirHandle?: any; // Handle of the subfolder where file currently resides
  isNestedInSubfolder?: boolean; // True if file was discovered inside an existing subfolder
}

export interface PlannedFileMove {
  file: FileItemInfo;
  targetFolder: string; // e.g. "CLIENTE A" or "2026/09_Setembro"
  targetSubfolders: string[]; // ["CLIENTE A", "VÍDEOS"]
  targetFileName: string;
  hasRule: boolean;
}

export interface OrganizationPreviewData {
  totalFiles: number;
  foldersToCreate: string[];
  filesWithoutRule: number;
  plannedMoves: PlannedFileMove[];
  treeStructure: Record<string, string[]>; // folderPath -> list of file names
}

export interface OrganizationProgressState {
  currentStep: 'idle' | 'scanning' | 'model_select' | 'preview' | 'organizing' | 'completed' | 'error';
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  currentTargetFolder: string;
  percentage: number;
}

export interface OrganizationResultSummary {
  id: string;
  folderName: string;
  totalProcessed: number;
  organizedCount: number;
  ignoredCount: number;
  errorsCount: number;
  modelUsed: OrganizationModelType;
  modelTitle: string;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  errors: Array<{ fileName: string; reason: string }>;
  movedFilesLog: Array<{
    fileName: string;
    originalRelativePath: string;
    newRelativePath: string;
    fileHandle?: any;
    targetDirHandle?: any;
  }>;
  canUndo: boolean;
  undone?: boolean;
}

export interface CustomFileRule {
  id: string;
  extension: string; // e.g. ".mp4" or "mp4"
  targetFolder: string; // e.g. "VÍDEOS"
}

export interface AppPreferences {
  duplicateAction: 'rename' | 'skip'; // rename: video (1).mp4
  autoOpenFolderOnComplete: boolean;
  createZipFallback: boolean;
}
