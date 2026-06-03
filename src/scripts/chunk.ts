// Splits a whole book into ordered, bite-size "passages" for typing.
// Keeps natural boundaries: never breaks a word, prefers paragraph and
// sentence ends, and packs short sentences together up to ~maxChars.

export function chunkText(text: string, maxChars = 320): string[] {
  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ /g, ' ')
    .replace(/[ ]{2,}/g, ' ');

  const paragraphs = clean
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];

  const pushWrapped = (buf: string) => {
    // Hard-wrap an over-long run at word boundaries as a last resort.
    let rest = buf.trim();
    while (rest.length > maxChars) {
      let cut = rest.lastIndexOf(' ', maxChars);
      if (cut <= 0) cut = maxChars;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  };

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      chunks.push(para);
      continue;
    }
    // Split into sentences and greedily pack them.
    const sentences = para.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [para];
    let buf = '';
    for (const raw of sentences) {
      const sent = raw.trim();
      if (!sent) continue;
      if (buf && buf.length + 1 + sent.length > maxChars) {
        pushWrapped(buf);
        buf = sent;
      } else {
        buf = buf ? `${buf} ${sent}` : sent;
      }
    }
    if (buf) pushWrapped(buf);
  }

  return chunks.length ? chunks : [clean.trim()];
}

/** Estimate passage count without materialising every chunk (cheap heuristic). */
export function estimatePassages(chars: number, maxChars = 320): number {
  return Math.max(1, Math.round(chars / (maxChars * 0.86)));
}
