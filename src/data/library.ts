import { passages } from './books.ts';
import generated from './generated-library.json';

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  /** 'book' = full text fetched from /books/<id>.txt; 'warmup' = short inline text. */
  kind: 'book' | 'warmup';
  /** Path under public/ for full books. */
  file?: string;
  /** Inline text for warm-ups. */
  text?: string;
  /** Total character count of the source text. */
  chars: number;
}

interface GeneratedEntry {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: string;
  file: string;
  chars: number;
}

// Full public-domain books, populated by scripts/fetch-books.mjs at build time.
const fullBooks: Book[] = (generated as GeneratedEntry[]).map((b) => ({
  id: b.id,
  title: b.title,
  author: b.author,
  year: b.year,
  genre: b.genre,
  kind: 'book',
  file: b.file,
  chars: b.chars,
}));

// Short warm-up passages — always available, even before any book is fetched.
const warmups: Book[] = passages.map((p) => ({
  id: p.id,
  title: p.title,
  author: p.author,
  year: p.year,
  genre: p.genre,
  kind: 'warmup',
  text: p.text,
  chars: p.text.length,
}));

// Full books take priority; fall back to a warm-up only if no full book shares
// the same id (so a fetched book replaces its short-passage namesake).
const fullIds = new Set(fullBooks.map((b) => b.id));
const uniqueWarmups = warmups.filter((w) => !fullIds.has(w.id));

export const books: Book[] = [...fullBooks, ...uniqueWarmups];
export const hasFullBooks = fullBooks.length > 0;

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export const genres: string[] = Array.from(new Set(books.map((b) => b.genre))).sort();
