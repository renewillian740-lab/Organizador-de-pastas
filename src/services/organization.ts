import {
  FileItemInfo,
  OrganizationModelType,
  OrganizationPreviewData,
  PlannedFileMove,
  CustomFileRule,
} from '../types/organizer';
import { FolderNode } from '../types';
import { DEFAULT_ROOT_FOLDER } from '../data/defaultStructure';

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
    id: 'project_template',
    title: 'MEUS PROJETOS (MODELO SALVO)',
    icon: '🗂️',
    badge: 'Recomendado',
    description: 'Cria as pastas idênticas ao seu projeto configurado (01_PROJETOS, 02_FOOTAGE, 03_ASSETS, 04_EXPORT) e distribui os arquivos nelas.',
  },
  {
    id: 'client',
    title: 'POR CLIENTE',
    icon: '📁',
    badge: 'Popular',
    description: 'Organiza os arquivos agrupando por cliente identificado no nome.',
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
    title: 'POR TIPO DE ARQUIVO',
    icon: '🎬',
    badge: 'Estruturado',
    description: 'Separa por projetos editáveis, brutos, documentos e entregas.',
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
 * Extracts client name from filename pattern
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
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'GERAL';
}

/**
 * Detects whether a path or file extension is internal to Adobe Premiere Pro or After Effects
 */
export function isAdobeInternalPath(pathStr: string, ext: string): boolean {
  const lower = pathStr.toLowerCase().replace(/\\/g, '/');
  const hasAdobeFolder = /(adobe premiere pro|adobe after effects|auto-save|video previews|audio previews|media cache|peak files)/i.test(lower);
  const isAdobeInternalExt = /\.(pek|cfa|prv|prfpset|ims|mcdb)$/i.test(ext);
  return hasAdobeFolder || isAdobeInternalExt;
}

export interface PremiereBundleInfo {
  isPremiere: boolean;
  projectDirName: string | null;
  internalSubPath: string | null;
}

/**
 * Categorizes a file into the user's project structure
 * (e.g. 01_PROJETOS, 02_FOOTAGE, 03_ASSETS, 04_EXPORT, etc.)
 */
function categorizeIntoProjectStructure(
  file: FileItemInfo,
  ext: string,
  rootFolder: FolderNode,
  ruleMap: Map<string, string>,
  premiereInfo: PremiereBundleInfo
): { targetFolder: string; targetSubfolders: string[] } {
  const activeMainFolders = (rootFolder.children || []).filter((c) => c.enabled !== false);
  if (activeMainFolders.length === 0) {
    return { targetFolder: '01_GERAL', targetSubfolders: ['01_GERAL'] };
  }

  // Helper to find folder by regex
  const findFolderByRegex = (regex: RegExp): FolderNode | undefined => {
    return activeMainFolders.find((f) => regex.test(f.name));
  };

  const projectFolder = findFolderByRegex(/proj|edit|prproj|aep|work/i) || activeMainFolders[0];
  const footageFolder = findFolderByRegex(/footage|bruto|raw|grav|cam|film|video/i) || activeMainFolders[1] || activeMainFolders[0];
  const assetsFolder = findFolderByRegex(/asset|som|audio|trilha|sfx|img|foto|design|fonte|recurso/i) || activeMainFolders[2] || activeMainFolders[0];
  const exportFolder = findFolderByRegex(/export|entrega|final|render|saida|aprov/i) || activeMainFolders[3] || activeMainFolders[activeMainFolders.length - 1];

  // =========================================================================
  // 🎬 CRITICAL USER RULE: PREMIERE / VIDEO PROJECT BUNDLES & CACHES
  // Premiere projects contain internal auto-saves, video previews, peak audio
  // files, and caches that MUST NOT be scattered into FOOTAGE, ASSETS or EXPORT,
  // NOR fragmented into dozens of subfolders.
  // They must remain grouped in ONE single project folder:
  // e.g. 01_PROJETOS/Premiere_AfterEffects
  // =========================================================================
  if (premiereInfo.isPremiere) {
    const activeSub = (projectFolder.children || []).filter((c) => c.enabled !== false);
    const premiereSub = activeSub.find((s) => /premiere|after|video|edit/i.test(s.name));
    const baseProjectDir = premiereSub
      ? `${projectFolder.name}/${premiereSub.name}`
      : projectFolder.name;

    return {
      targetFolder: baseProjectDir,
      targetSubfolders: baseProjectDir.split('/').filter(Boolean),
    };
  }

  // Check explicit rule map first for regular files
  if (ruleMap.has(ext)) {
    const customTarget = ruleMap.get(ext)!;
    return {
      targetFolder: customTarget,
      targetSubfolders: customTarget.split('/').filter(Boolean),
    };
  }

  const lowerName = file.name.toLowerCase();

  // 1. Check if it's an export / rendered deliverable (has export/final/v1/v2/preview keywords)
  const isExportKeyword = /(export|final|render|master|prev|previa|aprovad|_v\d|v\d\b)/i.test(lowerName);
  const isVideoExt = ['.mp4', '.mov', '.mkv', '.avi', '.m4v', '.braw', '.r3d', '.prores', '.mxf', '.mts', '.m2ts', '.wmv', '.flv', '.webm'].includes(ext);

  if (isExportKeyword && (isVideoExt || ['.pdf', '.zip'].includes(ext))) {
    const activeSub = (exportFolder.children || []).filter((c) => c.enabled !== false);
    if (/prev|previa|cliente/i.test(lowerName)) {
      const prevSub = activeSub.find((s) => /prev/i.test(s.name));
      if (prevSub) {
        return {
          targetFolder: `${exportFolder.name}/${prevSub.name}`,
          targetSubfolders: [exportFolder.name, prevSub.name],
        };
      }
    }
    const finalSub = activeSub.find((s) => /final|aprov/i.test(s.name));
    if (finalSub) {
      return {
        targetFolder: `${exportFolder.name}/${finalSub.name}`,
        targetSubfolders: [exportFolder.name, finalSub.name],
      };
    }
    return {
      targetFolder: exportFolder.name,
      targetSubfolders: [exportFolder.name],
    };
  }

  // 2. Project / Software editable files
  const isEditFile = [
    '.prproj',
    '.aep',
    '.psd',
    '.ai',
    '.blend',
    '.c4d',
    '.drp',
    '.fcp',
    '.fcpx',
    '.session',
    '.logic',
    '.als',
    '.flp',
    '.kdenlive',
    '.movpkg',
    '.fig',
    '.xd',
    '.sketch',
    '.cdr',
  ].includes(ext);

  if (isEditFile) {
    const activeSub = (projectFolder.children || []).filter((c) => c.enabled !== false);
    if (['.prproj', '.aep'].includes(ext)) {
      const vidSub = activeSub.find((s) => /premiere|after|video/i.test(s.name));
      if (vidSub) {
        return {
          targetFolder: `${projectFolder.name}/${vidSub.name}`,
          targetSubfolders: [projectFolder.name, vidSub.name],
        };
      }
    } else if (['.psd', '.ai'].includes(ext)) {
      const imgSub = activeSub.find((s) => /photo|illustrator|design/i.test(s.name));
      if (imgSub) {
        return {
          targetFolder: `${projectFolder.name}/${imgSub.name}`,
          targetSubfolders: [projectFolder.name, imgSub.name],
        };
      }
    }

    // Default to project folder
    return {
      targetFolder: projectFolder.name,
      targetSubfolders: [projectFolder.name],
    };
  }

  // 3. Raw Video Footage
  if (isVideoExt) {
    const activeSub = (footageFolder.children || []).filter((c) => c.enabled !== false);
    if (/(cam.*2|c02|camera_02)/i.test(lowerName)) {
      const c2 = activeSub.find((s) => /cam.*2|02/i.test(s.name));
      if (c2) {
        return {
          targetFolder: `${footageFolder.name}/${c2.name}`,
          targetSubfolders: [footageFolder.name, c2.name],
        };
      }
    } else if (/(drone|aerea|dji)/i.test(lowerName)) {
      const droneSub = activeSub.find((s) => /drone|extern/i.test(s.name));
      if (droneSub) {
        return {
          targetFolder: `${footageFolder.name}/${droneSub.name}`,
          targetSubfolders: [footageFolder.name, droneSub.name],
        };
      }
    }
    const c1 = activeSub.find((s) => /cam.*1|01/i.test(s.name));
    if (c1) {
      return {
        targetFolder: `${footageFolder.name}/${c1.name}`,
        targetSubfolders: [footageFolder.name, c1.name],
      };
    }
    return {
      targetFolder: footageFolder.name,
      targetSubfolders: [footageFolder.name],
    };
  }

  // 4. Audios, Soundtracks, SFX
  const isAudio = ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg', '.aif', '.aiff', '.wma', '.mid'].includes(ext);
  if (isAudio) {
    const activeSub = (assetsFolder.children || []).filter((c) => c.enabled !== false);
    const audioSub = activeSub.find((s) => /audio|trilha|som|sfx|musica/i.test(s.name));
    if (audioSub) {
      return {
        targetFolder: `${assetsFolder.name}/${audioSub.name}`,
        targetSubfolders: [assetsFolder.name, audioSub.name],
      };
    }
    return {
      targetFolder: assetsFolder.name,
      targetSubfolders: [assetsFolder.name],
    };
  }

  // 5. Images, Graphics, Logos, Vectors
  const isImage = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.tiff', '.eps', '.ico', '.bmp', '.raw', '.cr2', '.dng'].includes(ext);
  if (isImage) {
    const activeSub = (assetsFolder.children || []).filter((c) => c.enabled !== false);
    const imgSub = activeSub.find((s) => /imagem|foto|logo|grafic|vector/i.test(s.name));
    if (imgSub) {
      return {
        targetFolder: `${assetsFolder.name}/${imgSub.name}`,
        targetSubfolders: [assetsFolder.name, imgSub.name],
      };
    }
    return {
      targetFolder: assetsFolder.name,
      targetSubfolders: [assetsFolder.name],
    };
  }

  // 6. Documents, Fonts, Briefings, Others
  const isDocOrFont = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.csv', '.pptx', '.otf', '.ttf', '.woff', '.pages', '.numbers', '.key'].includes(ext);
  if (isDocOrFont) {
    const activeSub = (assetsFolder.children || []).filter((c) => c.enabled !== false);
    const docSub = activeSub.find((s) => /doc|fonte|font|brief/i.test(s.name));
    if (docSub) {
      return {
        targetFolder: `${assetsFolder.name}/${docSub.name}`,
        targetSubfolders: [assetsFolder.name, docSub.name],
      };
    }
    return {
      targetFolder: assetsFolder.name,
      targetSubfolders: [assetsFolder.name],
    };
  }

  // Fallback: Default to assets or first folder
  return {
    targetFolder: assetsFolder.name,
    targetSubfolders: [assetsFolder.name],
  };
}

/**
 * Plans the target folder and hierarchy for each file based on the selected model
 */
export function planOrganization(
  files: FileItemInfo[],
  model: OrganizationModelType,
  customRules: CustomFileRule[],
  projectRootFolder?: FolderNode
): OrganizationPreviewData {
  const plannedMoves: PlannedFileMove[] = [];
  const foldersSet = new Set<string>();
  const treeStructure: Record<string, string[]> = {};
  let filesWithoutRule = 0;
  let premiereFilesCount = 0;

  // Resolve project template root
  let activeRoot = projectRootFolder;
  if (!activeRoot && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('mac_folder_custom_template_v1');
      if (saved) activeRoot = JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  if (!activeRoot) {
    activeRoot = DEFAULT_ROOT_FOLDER;
  }

  // Build extension lookup map for custom model
  const ruleMap = new Map<string, string>();
  for (const rule of customRules) {
    const ext = rule.extension.startsWith('.') ? rule.extension.toLowerCase() : `.${rule.extension.toLowerCase()}`;
    ruleMap.set(ext, sanitizeFolderName(rule.targetFolder));
  }

  // 1. Identify all folders containing Premiere / After Effects projects or internal caches
  const premiereProjectDirs = new Set<string>();

  for (const f of files) {
    const rel = (f.relativePath || f.name).replace(/\\/g, '/');
    const parts = rel.split('/');
    const ext = getFileExtension(f.name);

    if (['.prproj', '.aep', '.aepx'].includes(ext)) {
      if (parts.length > 1) {
        // e.g. "Projeto_Comercial/Edicao.prproj" -> "Projeto_Comercial"
        const dir = parts.slice(0, -1).join('/');
        premiereProjectDirs.add(dir);
      }
    }

    // Also check if relative path contains known Adobe internal folders
    const adobeFolderMatch = rel.match(/(.*?)\b(Adobe Premiere Pro [^/]+|Adobe After Effects [^/]+|Media Cache Files|Peak Files)\b/i);
    if (adobeFolderMatch) {
      const parentDir = adobeFolderMatch[1].replace(/\/$/, '');
      if (parentDir) {
        premiereProjectDirs.add(parentDir);
      }
    }
  }

  const getPremiereInfo = (f: FileItemInfo, ext: string): PremiereBundleInfo => {
    const rel = (f.relativePath || f.name).replace(/\\/g, '/');
    const lower = rel.toLowerCase();
    const isAdobeExt = ['.prproj', '.aep', '.aepx', '.pek', '.cfa', '.prv', '.prfpset', '.ims', '.mcdb'].includes(ext);
    const isInternalFolder = /(adobe premiere pro|adobe after effects|auto-save|video previews|audio previews|media cache|peak files)/i.test(lower);

    // Check if file is inside a detected Premiere project directory
    for (const pDir of premiereProjectDirs) {
      if (rel === pDir || rel.startsWith(`${pDir}/`)) {
        const relInside = rel.slice(pDir.length).replace(/^\//, '');
        const parts = relInside.split('/').filter(Boolean);
        const internalSub = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
        return {
          isPremiere: true,
          projectDirName: pDir.split('/').pop() || pDir,
          internalSubPath: internalSub,
        };
      }
    }

    // If loose at root or in arbitrary subfolder, but has Adobe internal folder or cache extension
    if (isInternalFolder || isAdobeExt) {
      const parts = rel.split('/').filter(Boolean);
      const internalSub = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      return {
        isPremiere: true,
        projectDirName: null,
        internalSubPath: internalSub,
      };
    }

    return {
      isPremiere: false,
      projectDirName: null,
      internalSubPath: null,
    };
  };

  for (const file of files) {
    let targetFolder = '';
    let targetSubfolders: string[] = [];
    let hasRule = true;
    const ext = getFileExtension(file.name);
    const premiereInfo = getPremiereInfo(file, ext);

    if (premiereInfo.isPremiere) {
      premiereFilesCount++;
      file.isProjectInternal = true;
    }

    if (model === 'project_template') {
      const res = categorizeIntoProjectStructure(file, ext, activeRoot, ruleMap, premiereInfo);
      targetFolder = res.targetFolder;
      targetSubfolders = res.targetSubfolders;
    } else if (model === 'client') {
      const clientName = extractClientFromFileName(file.name);
      if (premiereInfo.isPremiere) {
        targetFolder = `${clientName}/Projetos_Edicao`;
      } else {
        targetFolder = clientName;
      }
      targetSubfolders = targetFolder.split('/').filter(Boolean);
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

      if (premiereInfo.isPremiere || isEditFile) {
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
    hasPremiereProjects: premiereFilesCount > 0,
    premiereFilesCount,
  };
}
