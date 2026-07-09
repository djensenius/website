import { defineConfig } from 'vite-plus';

// Vite+ unified toolchain config (lint / format / test / check).
// Astro drives dev/build; Vite+ provides the tooling layer.
// Legacy assets (jslinux-mobile submodule, root/ text files) are excluded —
// they are migration reference material, not part of the new codebase.
const legacyIgnore = [
  'dist/**',
  '.astro/**',
  'node_modules/**',
  'jslinux-mobile/**',
  'root/**',
  'root.bin',
];

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
  lint: {
    ignorePatterns: legacyIgnore,
  },
  fmt: {
    ignorePatterns: legacyIgnore,
    semi: true,
    singleQuote: true,
  },
});
