#!/usr/bin/env node
// Downloads the curated public-domain books from Project Gutenberg, strips the
// license boilerplate, and writes:
//   - public/books/<id>.txt          (the cleaned book text, served statically)
//   - src/data/generated-library.json (metadata for whatever is available)
//
// Designed to be safe in any environment:
//   * Skips books whose .txt already exists (so it's cheap on rebuilds).
//   * Never throws on a failed download — it logs and moves on, so offline
//     builds still succeed with whatever is already present.
//
// Runs automatically via the "prebuild" npm hook, and manually with
// `npm run fetch-books`.

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const booksDir = path.join(root, 'public', 'books');
const manifestPath = path.join(root, 'src', 'data', 'generated-library.json');
const configPath = path.join(__dirname, 'books.config.json');

const MIN_BYTES = 2000; // anything smaller is almost certainly an error page
const REQUEST_TIMEOUT = 25000;

function urlsFor(id) {
  return [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
  ];
}

async function download(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'typing-tool/1.0 (public-domain book fetcher)' },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text && text.length >= MIN_BYTES ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Remove the Project Gutenberg header/footer, leaving just the work itself.
function stripBoilerplate(raw) {
  let text = raw.replace(/\r\n/g, '\n');

  const startRe = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const endRe = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;

  const startMatch = text.match(startRe);
  if (startMatch) text = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = text.match(endRe);
  if (endMatch) text = text.slice(0, endMatch.index);

  // Drop a common "produced by" line and any leading blank lines.
  text = text.replace(/^\s*Produced by[^\n]*\n/i, '');

  // Normalise whitespace: collapse 3+ blank lines to a paragraph break,
  // trim trailing spaces, and tidy the ends.
  text = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

async function loadConfig() {
  const raw = await readFile(configPath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  await mkdir(booksDir, { recursive: true });
  const config = await loadConfig();
  const manifest = [];

  for (const book of config) {
    const outPath = path.join(booksDir, `${book.id}.txt`);
    let cleaned = null;

    if (existsSync(outPath)) {
      const s = await stat(outPath);
      if (s.size >= MIN_BYTES) {
        cleaned = await readFile(outPath, 'utf8');
      }
    }

    if (!cleaned) {
      let raw = null;
      for (const url of urlsFor(book.gutenbergId)) {
        raw = await download(url);
        if (raw) break;
      }
      if (!raw) {
        console.warn(`⚠  skipped ${book.id} (download unavailable)`);
        continue;
      }
      cleaned = stripBoilerplate(raw);
      if (cleaned.length < MIN_BYTES) {
        console.warn(`⚠  skipped ${book.id} (text too short after cleaning)`);
        continue;
      }
      await writeFile(outPath, cleaned, 'utf8');
      console.log(`✓  ${book.id.padEnd(28)} ${(cleaned.length / 1024).toFixed(0)} KB`);
    } else {
      console.log(`•  ${book.id.padEnd(28)} cached`);
    }

    manifest.push({
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year,
      genre: book.genre,
      file: `/books/${book.id}.txt`,
      chars: cleaned.length,
    });
  }

  // Keep a stable order matching the config.
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${manifest.length} book(s) to the library manifest.`);
}

main().catch((err) => {
  // Never fail the build on a fetch problem — write an empty manifest if needed.
  console.warn('fetch-books: non-fatal error —', err?.message || err);
  if (!existsSync(manifestPath)) {
    writeFile(manifestPath, '[]\n').catch(() => {});
  }
});
