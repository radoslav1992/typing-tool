// Maps a character to the physical key(s) that produce it, so the on-screen
// keyboard can highlight the next key to press (and which finger / shift state).

export const KEYBOARD_ROWS: string[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'RShift'],
  ['Space'],
];

// Characters reachable with Shift, mapped to their base key.
const SHIFT_MAP: Record<string, string> = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6',
  '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'",
  '<': ',', '>': '.', '?': '/',
};

export interface KeyTarget {
  /** The key cap to highlight. */
  key: string;
  /** Whether Shift must be held. */
  shift: boolean;
}

export function keyForChar(ch: string): KeyTarget | null {
  if (ch === ' ') return { key: 'Space', shift: false };
  if (ch === '\n') return { key: 'Enter', shift: false };
  if (ch === '\t') return { key: 'Tab', shift: false };

  if (ch >= 'A' && ch <= 'Z') return { key: ch.toLowerCase(), shift: true };
  if (ch >= 'a' && ch <= 'z') return { key: ch, shift: false };
  if (ch >= '0' && ch <= '9') return { key: ch, shift: false };

  if (ch in SHIFT_MAP) return { key: SHIFT_MAP[ch], shift: true };

  // Unshifted punctuation that sits directly on a key cap.
  const direct = ['`', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/'];
  if (direct.includes(ch)) return { key: ch, shift: false };

  return null;
}
