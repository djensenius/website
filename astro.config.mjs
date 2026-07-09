// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://jensenius.com',
  // Content lives as Markdown collections under src/content (see issue #17).
});
