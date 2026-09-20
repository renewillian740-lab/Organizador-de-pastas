import { OrganizationResultSummary } from '../types/organizer';

const HISTORY_STORAGE_KEY = 'organizador_history_v1';

export function loadHistory(): OrganizationResultSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
  }
  return [];
}

export function saveHistory(history: OrganizationResultSummary[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Erro ao salvar histórico:', err);
  }
}

export function addHistoryEntry(entry: OrganizationResultSummary): void {
  const current = loadHistory();
  const updated = [entry, ...current.slice(0, 49)]; // keep up to 50 entries
  saveHistory(updated);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function markHistoryItemAsUndone(id: string): void {
  const current = loadHistory();
  const updated = current.map((item) =>
    item.id === id ? { ...item, undone: true, canUndo: false } : item
  );
  saveHistory(updated);
}

export function formatDateTimeNice(dateObj = new Date()): { dateFormatted: string; timeFormatted: string } {
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear();

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes}`;

  let dateFormatted = '';
  if (isToday) {
    dateFormatted = 'Hoje';
  } else if (isYesterday) {
    dateFormatted = 'Ontem';
  } else {
    dateFormatted = dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  return { dateFormatted, timeFormatted };
}
