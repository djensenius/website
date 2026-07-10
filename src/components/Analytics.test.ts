import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

test('invalid analytics script source is ignored when analytics is disabled', () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PUBLIC_PLAUSIBLE_SRC: 'javascript:alert(1)',
  };
  delete env.PUBLIC_PLAUSIBLE_DOMAIN;

  execFileSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    env,
    stdio: 'pipe',
  });

  const html = readHtmlFiles('dist').join('\n');
  expect(html).not.toContain('data-domain');
  expect(html).not.toContain('plausible.io/js/script.js');
}, 120_000);

function readHtmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return readHtmlFiles(path);
    return path.endsWith('.html') ? [readFileSync(path, 'utf8')] : [];
  });
}
