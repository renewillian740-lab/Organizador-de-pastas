import { CustomFileRule } from '../types/organizer';

const RULES_STORAGE_KEY = 'organizador_custom_rules_v1';

export const DEFAULT_RULES: CustomFileRule[] = [
  { id: 'rule-mp4', extension: '.mp4', targetFolder: 'VÍDEOS' },
  { id: 'rule-mov', extension: '.mov', targetFolder: 'VÍDEOS' },
  { id: 'rule-mkv', extension: '.mkv', targetFolder: 'VÍDEOS' },
  { id: 'rule-avi', extension: '.avi', targetFolder: 'VÍDEOS' },
  { id: 'rule-wav', extension: '.wav', targetFolder: 'ÁUDIO' },
  { id: 'rule-mp3', extension: '.mp3', targetFolder: 'ÁUDIO' },
  { id: 'rule-aac', extension: '.aac', targetFolder: 'ÁUDIO' },
  { id: 'rule-jpg', extension: '.jpg', targetFolder: 'IMAGENS' },
  { id: 'rule-jpeg', extension: '.jpeg', targetFolder: 'IMAGENS' },
  { id: 'rule-png', extension: '.png', targetFolder: 'IMAGENS' },
  { id: 'rule-webp', extension: '.webp', targetFolder: 'IMAGENS' },
  { id: 'rule-pdf', extension: '.pdf', targetFolder: 'DOCUMENTOS' },
  { id: 'rule-docx', extension: '.docx', targetFolder: 'DOCUMENTOS' },
  { id: 'rule-xlsx', extension: '.xlsx', targetFolder: 'PLANILHAS' },
  { id: 'rule-zip', extension: '.zip', targetFolder: 'ARQUIVOS_COMPACTADOS' },
  { id: 'rule-psd', extension: '.psd', targetFolder: 'DESIGN' },
  { id: 'rule-ai', extension: '.ai', targetFolder: 'DESIGN' },
];

export function loadSavedRules(): CustomFileRule[] {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar regras:', err);
  }
  return DEFAULT_RULES;
}

export function saveRules(rules: CustomFileRule[]): void {
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.error('Erro ao salvar regras:', err);
  }
}

export function resetRulesToDefault(): CustomFileRule[] {
  saveRules(DEFAULT_RULES);
  return DEFAULT_RULES;
}
