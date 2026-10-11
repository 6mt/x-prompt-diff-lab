import type { Experiment } from '../types';

const SESSIONS_KEY = 'pdl:sessions:v1';
const DRAFT_KEY = 'pdl:draft:v1';
const MAX_SESSIONS = 20;

export interface Draft {
  taskBlurb: string;
  promptA: string;
  promptB: string;
  outputA: string;
  outputB: string;
}

export function loadSessions(): Experiment[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Experiment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(list: Experiment[]): void {
  const trimmed = list
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SESSIONS);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
}

export function upsertSession(exp: Experiment): Experiment[] {
  const list = loadSessions().filter((s) => s.id !== exp.id);
  list.unshift(exp);
  saveSessions(list);
  return loadSessions();
}

export function deleteSession(id: string): Experiment[] {
  const list = loadSessions().filter((s) => s.id !== id);
  saveSessions(list);
  return list;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function exportAllJson(sessions: Experiment[], draft: Draft): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      draft,
      sessions,
    },
    null,
    2,
  );
}

export function importFromJson(text: string): { draft?: Draft; sessions: Experiment[] } {
  const data = JSON.parse(text) as {
    draft?: Draft;
    sessions?: Experiment[];
    // also accept a bare experiment or array
  };
  if (Array.isArray(data)) {
    return { sessions: data as Experiment[] };
  }
  if (data.sessions || data.draft) {
    return { draft: data.draft, sessions: data.sessions ?? [] };
  }
  // single experiment
  if ('promptA' in (data as object)) {
    return { sessions: [data as unknown as Experiment] };
  }
  throw new Error('Unrecognized JSON format');
}

export function newId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
