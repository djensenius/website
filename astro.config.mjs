// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Normalize BASE_PATH so Astro always receives a value with exactly one leading
// and trailing slash (e.g. "website" or "/website" → "/website/"). Astro expects
// `base` in this form; the Pages deploy passes the raw project subpath.
const rawBase = process.env.BASE_PATH || '/';
const base = `/${rawBase.replace(/^\/+|\/+$/g, '')}/`.replace(/\/{2,}/g, '/');

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://david.jensenius.com',
  // BASE_PATH lets the GitHub Pages preview deploy (issue #40) serve from the
  // project subpath (e.g. /website) while production at the custom domain uses '/'.
  base,
  integrations: [sitemap()],
  // Content lives as Markdown collections under src/content (see issue #17).
});
