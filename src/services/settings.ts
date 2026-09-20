import { AppPreferences } from '../types/organizer';

const SETTINGS_STORAGE_KEY = 'organizador_settings_v1';

export const DEFAULT_PREFERENCES: AppPreferences = {
  duplicateAction: 'rename',
  autoOpenFolderOnComplete: true,
  createZipFallback: false,
};

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Erro ao carregar preferências:', err);
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Erro ao salvar preferências:', err);
  }
}

export function resetPreferencesToDefault(): AppPreferences {
  savePreferences(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
}
