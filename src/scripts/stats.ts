// Progress tracking via localStorage. No backend required — results live in
// the user's browser, which keeps the whole app deployable as static files.

export interface SessionResult {
  id: string;
  date: number; // epoch ms
  source: string; // book title or "Custom text"
  wpm: number;
  rawWpm: number;
  accuracy: number;
  chars: number;
  errors: number;
  durationSec: number;
}

const KEY = 'tt-results';
const MAX = 500;

export function loadResults(): SessionResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResult(r: Omit<SessionResult, 'id' | 'date'>): SessionResult {
  const full: SessionResult = {
    ...r,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    date: Date.now(),
  };
  const all = loadResults();
  all.unshift(full);
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
  } catch {
    /* storage full or unavailable — ignore */
  }
  return full;
}

export function clearResults(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export interface Aggregate {
  sessions: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  totalChars: number;
  totalSeconds: number;
}

export function aggregate(results: SessionResult[]): Aggregate {
  if (results.length === 0) {
    return { sessions: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0, totalChars: 0, totalSeconds: 0 };
  }
  let bestWpm = 0;
  let sumWpm = 0;
  let sumAcc = 0;
  let totalChars = 0;
  let totalSeconds = 0;
  for (const r of results) {
    bestWpm = Math.max(bestWpm, r.wpm);
    sumWpm += r.wpm;
    sumAcc += r.accuracy;
    totalChars += r.chars;
    totalSeconds += r.durationSec;
  }
  return {
    sessions: results.length,
    bestWpm,
    avgWpm: Math.round(sumWpm / results.length),
    avgAccuracy: Math.round((sumAcc / results.length) * 10) / 10,
    totalChars,
    totalSeconds: Math.round(totalSeconds),
  };
}

// --- Custom uploads ---------------------------------------------------------

export interface CustomText {
  id: string;
  title: string;
  text: string;
  date: number;
}

const CUSTOM_KEY = 'tt-custom';

export function loadCustomTexts(): CustomText[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomText(title: string, text: string): CustomText {
  const item: CustomText = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    title: title.trim() || 'Untitled text',
    text,
    date: Date.now(),
  };
  const all = loadCustomTexts();
  all.unshift(item);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {
    /* ignore */
  }
  return item;
}

export function getCustomText(id: string): CustomText | undefined {
  return loadCustomTexts().find((c) => c.id === id);
}

export function deleteCustomText(id: string): void {
  const all = loadCustomTexts().filter((c) => c.id !== id);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
