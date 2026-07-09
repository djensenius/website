import { expect, test } from 'vitest';
import {
  parse,
  parseFrontmatter,
  renderCode,
  renderPage,
  renderProject,
} from './gen-emulator-content.mjs';

test('parse splits frontmatter and body', () => {
  const { fm, body } = parse('---\ntitle: bio\norder: 1\n---\n\nHello world.\n');
  expect(fm.title).toBe('bio');
  expect(fm.order).toBe('1');
  expect(body).toBe('Hello world.');
});

test('parse tolerates content with no frontmatter', () => {
  const { fm, body } = parse('Just text.');
  expect(fm).toEqual({});
  expect(body).toBe('Just text.');
});

test('parseFrontmatter reads the repos list', () => {
  const fm = parseFrontmatter(
    'title: repos\nrepos:\n  - name: website\n    url: https://example.com/website\n  - name: gopod\n    url: https://example.com/gopod',
  );
  expect(fm.title).toBe('repos');
  expect(fm.repos).toEqual([
    { name: 'website', url: 'https://example.com/website' },
    { name: 'gopod', url: 'https://example.com/gopod' },
  ]);
});

test('renderPage underlines the title', () => {
  const out = renderPage({ id: 'bio', fm: { title: 'bio' }, body: 'About me.' });
  expect(out).toBe('bio\n===\n\nAbout me.\n');
});

test('renderProject includes year and summary', () => {
  const out = renderProject({
    id: '2016-telephone-booth',
    fm: { title: 'Telephone Booth', year: '2016', summary: 'A phone booth.' },
    body: 'Body text.',
  });
  expect(out).toContain('Telephone Booth (2016)');
  expect(out).toContain('A phone booth.');
  expect(out).toContain('Body text.');
});

test('renderCode lists repositories as name — url', () => {
  const out = renderCode({
    id: 'repos',
    fm: { title: 'repos', repos: [{ name: 'website', url: 'https://example.com/website' }] },
    body: 'More at example.',
  });
  expect(out).toContain('website — https://example.com/website');
  expect(out).toContain('More at example.');
});
