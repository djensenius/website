// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://jensenius.com',
  // BASE_PATH lets the GitHub Pages preview deploy (issue #40) serve from the
  // project subpath (e.g. /website) while production at the custom domain uses '/'.
  base: process.env.BASE_PATH || '/',
  // Content lives as Markdown collections under src/content (see issue #17).
});
