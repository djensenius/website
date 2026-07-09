import { defineConfig } from 'vite-plus';

// Vite+ unified toolchain config (lint / format / test / check).
// Astro drives dev/build; Vite+ provides the tooling layer.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
  lint: {
    ignorePatterns: ['dist/**', '.astro/**', 'node_modules/**'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
  },
});
