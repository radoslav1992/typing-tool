// Core typing engine: tracks keystrokes against a target text and computes
// live metrics (WPM, accuracy). Framework-free so it can be mounted from any
// Astro <script> tag and run entirely client-side.

export interface LiveStats {
  /** Net (adjusted) words per minute, the standard "WPM" figure. */
  wpm: number;
  /** Gross WPM, ignoring errors. */
  rawWpm: number;
  /** Share of correctly typed keystrokes, 0–100. */
  accuracy: number;
  /** Characters typed correctly so far. */
  correctChars: number;
  /** Total keystrokes registered (including corrected mistakes). */
  totalKeystrokes: number;
  /** Mistakes made (counts every wrong keystroke). */
  errors: number;
  /** Position of the caret within the target text. */
  position: number;
  /** Completion ratio, 0–1. */
  progress: number;
  /** Elapsed seconds since the first keystroke. */
  elapsed: number;
}

export type CharState = 'pending' | 'correct' | 'incorrect' | 'current';

export interface EngineOptions {
  onUpdate?: (stats: LiveStats) => void;
  onComplete?: (stats: LiveStats) => void;
  /** When true, a wrong key blocks progress until the correct key is pressed. */
  strict?: boolean;
}

export class TypingEngine {
  readonly target: string;
  private typed: string[] = [];
  private startTime: number | null = null;
  private finished = false;
  private errorCount = 0;
  private totalKeystrokes = 0;
  private opts: EngineOptions;

  constructor(target: string, opts: EngineOptions = {}) {
    // Normalise whitespace so newlines/tabs don't trip up the comparison.
    this.target = target.replace(/\r\n/g, '\n').replace(/\t/g, '  ').trimEnd();
    this.opts = opts;
  }

  get position(): number {
    return this.typed.length;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  /** Returns the per-character state for rendering the text. */
  states(): CharState[] {
    const out: CharState[] = new Array(this.target.length);
    for (let i = 0; i < this.target.length; i++) {
      if (i < this.typed.length) {
        out[i] = this.typed[i] === this.target[i] ? 'correct' : 'incorrect';
      } else if (i === this.typed.length) {
        out[i] = 'current';
      } else {
        out[i] = 'pending';
      }
    }
    return out;
  }

  /** The character the user should type next, or null when complete. */
  nextChar(): string | null {
    return this.typed.length < this.target.length ? this.target[this.typed.length] : null;
  }

  handleBackspace(): void {
    if (this.finished || this.typed.length === 0) return;
    this.typed.pop();
    this.emitUpdate();
  }

  handleChar(ch: string): void {
    if (this.finished) return;
    if (this.typed.length >= this.target.length) return;
    if (this.startTime === null) this.startTime = performance.now();

    const expected = this.target[this.typed.length];
    const correct = ch === expected;

    this.totalKeystrokes++;
    if (!correct) {
      this.errorCount++;
      if (this.opts.strict) {
        // Reject the keystroke but still count it as an error for accuracy.
        this.emitUpdate();
        return;
      }
    }

    this.typed.push(ch);

    if (this.typed.length === this.target.length) {
      this.finished = true;
      const stats = this.computeStats();
      this.opts.onUpdate?.(stats);
      this.opts.onComplete?.(stats);
      return;
    }
    this.emitUpdate();
  }

  setStrict(strict: boolean): void {
    this.opts.strict = strict;
  }

  reset(): void {
    this.typed = [];
    this.startTime = null;
    this.finished = false;
    this.errorCount = 0;
    this.totalKeystrokes = 0;
    this.emitUpdate();
  }

  private emitUpdate(): void {
    this.opts.onUpdate?.(this.computeStats());
  }

  computeStats(): LiveStats {
    const elapsedMs = this.startTime === null ? 0 : performance.now() - this.startTime;
    const elapsed = elapsedMs / 1000;
    const minutes = elapsedMs / 60000;

    let correctChars = 0;
    for (let i = 0; i < this.typed.length; i++) {
      if (this.typed[i] === this.target[i]) correctChars++;
    }

    // Standard convention: one "word" = 5 characters.
    const rawWpm = minutes > 0 ? this.typed.length / 5 / minutes : 0;
    const netWpm = minutes > 0 ? Math.max(0, correctChars / 5 / minutes) : 0;
    const accuracy =
      this.totalKeystrokes > 0
        ? ((this.totalKeystrokes - this.errorCount) / this.totalKeystrokes) * 100
        : 100;

    return {
      wpm: Math.round(netWpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 10) / 10,
      correctChars,
      totalKeystrokes: this.totalKeystrokes,
      errors: this.errorCount,
      position: this.typed.length,
      progress: this.target.length ? this.typed.length / this.target.length : 0,
      elapsed,
    };
  }
}
