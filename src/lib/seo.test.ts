import { describe, expect, it } from 'vitest';
import { absoluteSiteUrl, normalizeBasePath } from './seo';

describe('normalizeBasePath', () => {
  it.each([
    ['/', '/'],
    ['/website', '/website/'],
    ['/website/', '/website/'],
    ['website', '/website/'],
  ])('normalizes %s to %s', (base, expected) => {
    expect(normalizeBasePath(base)).toBe(expected);
  });
});

describe('absoluteSiteUrl', () => {
  it('does not double-prefix values that already include the base segment', () => {
    expect(absoluteSiteUrl('/website', 'https://jensenius.com', '/website/')).toBe(
      'https://jensenius.com/website',
    );
    expect(absoluteSiteUrl('/website/files', 'https://jensenius.com', '/website')).toBe(
      'https://jensenius.com/website/files',
    );
  });

  it('prefixes root-relative paths with the configured base', () => {
    expect(absoluteSiteUrl('/og.png', 'https://jensenius.com', '/website')).toBe(
      'https://jensenius.com/website/og.png',
    );
    expect(absoluteSiteUrl('/og.png', 'https://jensenius.com', '/')).toBe(
      'https://jensenius.com/og.png',
    );
  });

  it('leaves absolute URLs unchanged', () => {
    expect(absoluteSiteUrl('https://cdn.example/og.png', 'https://jensenius.com', '/website')).toBe(
      'https://cdn.example/og.png',
    );
  });
});
