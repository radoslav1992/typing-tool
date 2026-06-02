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

## Deploy to Cloudflare

This deploys as a **Worker that serves the static build** (Cloudflare's
"static assets" model). `wrangler.toml` points `[assets].directory` at `./dist`,
so `wrangler deploy` uploads the built site — no server code runs.

**Option A — Git integration (recommended).** Connect the repo in the
Cloudflare dashboard → Workers & Pages → Create → Workers → connect to Git:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (the default)

Cloudflare runs the build and then `wrangler deploy`, which reads
`wrangler.toml` and publishes `./dist`.

**Option B — direct upload with Wrangler:**

```bash
npm run build
npx wrangler deploy        # or: npm run deploy
```

> Deploying as a **Pages** project instead? Use
> `npx wrangler pages deploy dist` and remove the `[assets]` block from
> `wrangler.toml` (Pages uses `pages_build_output_dir = "dist"`). Mixing the
> Pages config with the `wrangler deploy` command is what caused the
> "Workers-specific command in a Pages project" error.

The site is fully static, so it serves from Cloudflare's edge with no
functions or runtime configuration required.
