import { defineConfig } from 'vite-plus';

// Vite+ unified toolchain config (lint / format / test / check).
// Astro drives dev/build; Vite+ provides the tooling layer.
const ignore = ['dist/**', '.astro/**', 'build/**', 'node_modules/**', 'public/emulator/**'];

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
  },
  lint: {
    ignorePatterns: ignore,
  },
  fmt: {
    ignorePatterns: ignore,
    semi: true,
    singleQuote: true,
  },
});
