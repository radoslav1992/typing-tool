import { defineConfig } from 'astro/config';

// Static output — builds to ./dist and deploys directly to Cloudflare Pages.
// No server adapter needed: the typing engine, progress tracking and custom
// uploads all run client-side (localStorage), so the whole app is static.
export default defineConfig({
  site: 'https://typing-tool.pages.dev',
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
