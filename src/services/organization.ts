import {
  FileItemInfo,
  OrganizationModelType,
  OrganizationPreviewData,
  PlannedFileMove,
  CustomFileRule,
} from '../types/organizer';

const MONTH_NAMES = [
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

export interface ModelOptionDefinition {
  id: OrganizationModelType;
  title: string;
  icon: string;
  badge: string;
  description: string;
}

export const ORGANIZATION_MODELS: ModelOptionDefinition[] = [
  {
    id: 'client',
    title: 'POR CLIENTE',
    icon: '📁',
    badge: 'Popular',
    description: 'Organiza os arquivos agrupando por cliente.',
  },
  {
    id: 'date',
    title: 'POR DATA',
    icon: '📅',
    badge: 'Cronológico',
    description: 'Organiza por ano e mês com base na data dos arquivos.',
  },
  {
    id: 'project',
    title: 'POR PROJETO',
    icon: '🎬',
    badge: 'Estruturado',
    description: 'Organiza usando uma estrutura profissional de projeto.',
  },
  {
    id: 'invoices',
    title: 'NOTAS FISCAIS',
    icon: '🧾',
    badge: 'Financeiro',
    description: 'Organiza notas por ano, mês e cliente.',
  },
  {
    id: 'custom',
    title: 'PERSONALIZADO',
    icon: '⚙️',
    badge: 'Regras',
    description: 'Permite definir e aplicar suas próprias regras por extensão.',
  },
];

/**
 * Extracts client name from filename pattern:
 * e.g. "[Empresa X] Contrato.pdf" -> "Empresa X"
 * e.g. "ClienteA_Video.mp4" -> "Cliente A"
 * e.g. "Apple - Briefing.docx" -> "Apple"
 */
function extractClientFromFileName(filename: string): string {
  const bracketMatch = filename.match(/^\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1].trim()) {
    return sanitizeFolderName(bracketMatch[1].trim());
  }

  const parenMatch = filename.match(/^\(([^\)]+)\)/);
  if (parenMatch && parenMatch[1].trim()) {
    return sanitizeFolderName(parenMatch[1].trim());
  }

  const dashParts = filename.split(/\s*[-–—]\s*/);
  if (dashParts.length > 1 && dashParts[0].trim().length > 1 && dashParts[0].length < 25) {
    return sanitizeFolderName(dashParts[0].trim());
  }

  const underscoreParts = filename.split('_');
  if (underscoreParts.length > 1 && underscoreParts[0].trim().length > 1 && underscoreParts[0].length < 25) {
    return sanitizeFolderName(underscoreParts[0].trim());
  }

  return 'OUTROS_CLIENTES';
}

function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.slice(idx).toLowerCase() : '';
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim().toUpperCase() || 'GERAL';
}

/**
 * Plans the target folder and hierarchy for each file based on the selected model
 */
export function planOrganization(
  files: FileItemInfo[],
  model: OrganizationModelType,
  customRules: CustomFileRule[]
): OrganizationPreviewData {
  const plannedMoves: PlannedFileMove[] = [];
  const foldersSet = new Set<string>();
  const treeStructure: Record<string, string[]> = {};
  let filesWithoutRule = 0;

  // Build extension lookup map for custom model
  const ruleMap = new Map<string, string>();
  for (const rule of customRules) {
    const ext = rule.extension.startsWith('.') ? rule.extension.toLowerCase() : `.${rule.extension.toLowerCase()}`;
    ruleMap.set(ext, sanitizeFolderName(rule.targetFolder));
  }

  for (const file of files) {
    let targetFolder = '';
    let targetSubfolders: string[] = [];
    let hasRule = true;
    const ext = getFileExtension(file.name);

    if (model === 'client') {
      const clientName = extractClientFromFileName(file.name);
      targetFolder = clientName;
      targetSubfolders = [clientName];
    } else if (model === 'date') {
      const d = new Date(file.lastModified || Date.now());
      const year = String(d.getFullYear());
      const month = MONTH_NAMES[d.getMonth()] || '00_Mes';
      targetFolder = `${year}/${month}`;
      targetSubfolders = [year, month];
    } else if (model === 'project') {
      // Structure: 01_BRUTOS, 02_TRABALHO, 03_ENTREGAS, 04_DOCUMENTOS
      const isVideoOrAudio = ['.mp4', '.mov', '.mkv', '.avi', '.wav', '.mp3', '.aac'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.raw', '.cr2', '.dng'].includes(ext);
      const isEditFile = ['.prproj', '.aep', '.psd', '.ai', '.blend', '.c4d', '.fcpx'].includes(ext);
      const isDoc = ['.pdf', '.docx', '.xlsx', '.txt', '.csv', '.pptx'].includes(ext);

      if (isEditFile) {
        targetFolder = '02_TRABALHO/Projetos_Editaveis';
        targetSubfolders = ['02_TRABALHO', 'Projetos_Editaveis'];
      } else if (isVideoOrAudio || isImage) {
        targetFolder = '01_ARQUIVOS_BRUTOS';
        targetSubfolders = ['01_ARQUIVOS_BRUTOS'];
      } else if (isDoc) {
        targetFolder = '04_DOCUMENTOS';
        targetSubfolders = ['04_DOCUMENTOS'];
      } else {
        targetFolder = '03_ENTREGAS';
        targetSubfolders = ['03_ENTREGAS'];
      }
    } else if (model === 'invoices') {
      const d = new Date(file.lastModified || Date.now());
      const year = String(d.getFullYear());
      const month = MONTH_NAMES[d.getMonth()] || '00_Mes';
      const client = extractClientFromFileName(file.name);
      targetFolder = `NOTAS_FISCAIS/${year}/${month}/${client}`;
      targetSubfolders = ['NOTAS_FISCAIS', year, month, client];
    } else if (model === 'custom') {
      const matchedFolder = ruleMap.get(ext);
      if (matchedFolder) {
        targetFolder = matchedFolder;
        targetSubfolders = [matchedFolder];
      } else {
        targetFolder = 'OUTROS_SEM_REGRA';
        targetSubfolders = ['OUTROS_SEM_REGRA'];
        hasRule = false;
        filesWithoutRule++;
      }
    }

    foldersSet.add(targetFolder);

    if (!treeStructure[targetFolder]) {
      treeStructure[targetFolder] = [];
    }
    treeStructure[targetFolder].push(file.name);

    plannedMoves.push({
      file,
      targetFolder,
      targetSubfolders,
      targetFileName: file.name,
      hasRule,
    });
  }

  return {
    totalFiles: files.length,
    foldersToCreate: Array.from(foldersSet).sort(),
    filesWithoutRule,
    plannedMoves,
    treeStructure,
  };
}
