# Typing Tool

Practice typing by **retyping books**. An [Astro](https://astro.build) app that
runs entirely in the browser and deploys to **Cloudflare Pages**.

> Inspired by the "type along to a book" idea — built from scratch as an
> independent, open implementation. Practice texts are works in the public domain.

## Features

- **Typing mode** — retype real passages, with live per-character feedback
  (correct / incorrect / next) and a moving caret.
- **Reading mode** — flip any text into a clean, distraction-free reader.
- **On-screen keyboard** — highlights the next key (and Shift) to build
  touch-typing muscle memory.
- **Live metrics** — net & raw WPM, accuracy, errors, elapsed time, progress.
- **Custom uploads** — paste text or load a `.txt` file and practice on your
  own words (saved locally).
- **Progress tracking** — every finished session is stored in `localStorage`
  and charted on the Stats page. No account, no server.
- **Customisable** — serif / sans / mono fonts, adjustable size and line
  spacing, light & dark "paper" themes, optional strict mode.

## Tech

- **Astro 4** (static output — no SSR adapter needed)
- Vanilla TypeScript for the typing engine, stats and keyboard logic
- Plain CSS with custom properties (theming, no framework)
- No backend — all state lives in the browser, which keeps deploys trivial

## Project structure

```
src/
  data/books.ts            # public-domain practice passages
  layouts/Base.astro       # shell + theme bootstrap
  components/               # Header, Footer
  pages/
    index.astro            # landing page
    library.astro          # browse / filter passages
    practice.astro         # the typing surface (core)
    upload.astro           # custom text
    stats.astro            # progress dashboard
  scripts/
    typing-engine.ts       # keystroke tracking + WPM/accuracy
    stats.ts               # localStorage results & custom texts
    keyboard.ts            # char -> physical key mapping
```

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
```

## Build

```bash
npm run build        # outputs static site to ./dist
npm run preview      # preview the production build
```

## Deploy to Cloudflare Pages

**Option A — Git integration (recommended).** Connect this repo in the
Cloudflare dashboard → Workers & Pages → Create → Pages, with:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

`wrangler.toml` already sets `pages_build_output_dir = "dist"`.

**Option B — direct upload with Wrangler:**

```bash
npm run build
npx wrangler pages deploy dist        # or: npm run deploy
```

The site is fully static, so it serves from Cloudflare's edge with no
functions or runtime configuration required.
