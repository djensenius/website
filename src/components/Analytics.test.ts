import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

test('invalid analytics script source is ignored when analytics is disabled', () => {
  buildSite({
    PUBLIC_PLAUSIBLE_DOMAIN: undefined,
    PUBLIC_PLAUSIBLE_SRC: 'javascript:alert(1)',
  });

  const html = readHtmlFiles('dist').join('\n');
  expect(html).not.toContain('data-domain');
  expect(html).not.toContain('plausible.io/js/script.js');
}, 120_000);

test('default analytics script is emitted when analytics is enabled', () => {
  buildSite({
    PUBLIC_PLAUSIBLE_DOMAIN: 'example.com',
    PUBLIC_PLAUSIBLE_SRC: undefined,
  });

  const html = readHtmlFiles('dist').join('\n');
  expect(html).toContain('data-domain="example.com"');
  expect(html).toContain('src="https://plausible.io/js/script.js"');
}, 120_000);

test('invalid analytics script source fails the build when analytics is enabled', () => {
  expect(() =>
    buildSite({
      PUBLIC_PLAUSIBLE_DOMAIN: 'example.com',
      PUBLIC_PLAUSIBLE_SRC: 'https:example.com/js/script.js',
    }),
  ).toThrow(/Invalid PUBLIC_PLAUSIBLE_SRC/);
}, 120_000);

test('empty analytics script source falls back to the default when analytics is enabled', () => {
  buildSite({
    PUBLIC_PLAUSIBLE_DOMAIN: 'example.com',
    PUBLIC_PLAUSIBLE_SRC: '   ',
  });

  const html = readHtmlFiles('dist').join('\n');
  expect(html).toContain('data-domain="example.com"');
  expect(html).toContain('src="https://plausible.io/js/script.js"');
}, 120_000);

function buildSite(overrides: {
  PUBLIC_PLAUSIBLE_DOMAIN: string | undefined;
  PUBLIC_PLAUSIBLE_SRC: string | undefined;
}) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
  };
  for (const [key, value] of Object.entries(overrides)) {
    env[key] = value ?? '';
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
