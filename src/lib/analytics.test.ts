import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { resolveAnalyticsConfig } from './analytics';

test('analytics is disabled when the domain is unset or empty', () => {
  expect(
    resolveAnalyticsConfig(options({ domain: undefined, src: 'javascript:alert(1)' })),
  ).toBeUndefined();
  expect(
    resolveAnalyticsConfig(options({ domain: '   ', src: 'javascript:alert(1)' })),
  ).toBeUndefined();
});

test('unset or empty script source falls back to the default when analytics is enabled', () => {
  expect(resolveAnalyticsConfig(options({ domain: 'example.com', src: undefined }))?.src).toBe(
    'https://plausible.io/js/script.js',
  );
  expect(resolveAnalyticsConfig(options({ domain: 'example.com', src: '   ' }))?.src).toBe(
    'https://plausible.io/js/script.js',
  );
});

test('valid https script source is allowed unchanged', () => {
  expect(
    resolveAnalyticsConfig(
      options({ domain: 'example.com', src: 'https://plausible.example/js/script.js' }),
    )?.src,
  ).toBe('https://plausible.example/js/script.js');
});

test('hostless and invalid script sources throw when analytics is enabled', () => {
  expect(() =>
    resolveAnalyticsConfig(
      options({ domain: 'example.com', src: 'https:example.com/js/script.js' }),
    ),
  ).toThrow(/Invalid PUBLIC_PLAUSIBLE_SRC/);
  expect(() =>
    resolveAnalyticsConfig(options({ domain: 'example.com', src: 'javascript:alert(1)' })),
  ).toThrow(/Invalid PUBLIC_PLAUSIBLE_SRC/);
});

test('root-relative script source is normalized under the Astro base URL', () => {
  expect(
    resolveAnalyticsConfig(
      options({ domain: 'example.com', src: '/js/script.js', baseUrl: '/website/' }),
    )?.src,
  ).toBe('/website/js/script.js');
});

test('http script source is allowed only during local dev', () => {
  expect(() =>
    resolveAnalyticsConfig(
      options({ domain: 'example.com', src: 'http://localhost:8000/script.js', dev: false }),
    ),
  ).toThrow(/Invalid PUBLIC_PLAUSIBLE_SRC/);
  expect(
    resolveAnalyticsConfig(
      options({ domain: 'example.com', src: 'http://localhost:8000/script.js', dev: true }),
    )?.src,
  ).toBe('http://localhost:8000/script.js');
});

test('analytics component emits the default script in built HTML when enabled', () => {
  buildSite({
    PUBLIC_PLAUSIBLE_DOMAIN: 'example.com',
    PUBLIC_PLAUSIBLE_SRC: '',
  });

  const html = readHtmlFiles('dist').join('\n');
  expect(html).toContain('data-domain="example.com"');
  expect(html).toContain('src="https://plausible.io/js/script.js"');
}, 120_000);

function options(overrides: { domain?: string; src?: string; baseUrl?: string; dev?: boolean }) {
  return {
    domain: overrides.domain,
    src: overrides.src,
    baseUrl: overrides.baseUrl ?? '/',
    dev: overrides.dev ?? false,
  };
}

function buildSite(overrides: { PUBLIC_PLAUSIBLE_DOMAIN: string; PUBLIC_PLAUSIBLE_SRC: string }) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
  };
  for (const [key, value] of Object.entries(overrides)) {
    env[key] = value;
  }

  execFileSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    env,
    stdio: 'pipe',
  });
}

function readHtmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return readHtmlFiles(path);
    return path.endsWith('.html') ? [readFileSync(path, 'utf8')] : [];
  });
}
