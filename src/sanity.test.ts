import { expect, test } from 'vitest';

// Sanity test to exercise the Vite+ (Vitest) pipeline in CI.
test('test runner is wired up', () => {
  expect(1 + 1).toBe(2);
});
