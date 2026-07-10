import { expect, test } from 'vitest';
import { parse, parseFrontmatter, renderPage, renderProject } from './gen-emulator-content.mjs';

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

test('parseFrontmatter reads the links list', () => {
  const fm = parseFrontmatter(
    'title: project\nlinks:\n  - label: Source\n    url: https://example.com/source\n  - label: More information\n    url: https://example.com/info',
  );
  expect(fm.title).toBe('project');
  expect(fm.links).toEqual([
    { label: 'Source', url: 'https://example.com/source' },
    { label: 'More information', url: 'https://example.com/info' },
  ]);
});

test('renderPage renders the title as a Markdown heading', () => {
  const out = renderPage({ id: 'bio', fm: { title: 'bio' }, body: 'About me.' });
  expect(out).toBe('# bio\n\nAbout me.\n');
});

test('renderProject includes year and summary', () => {
  const out = renderProject({
    id: '2016-telephone-booth',
    fm: {
      title: 'Telephone Booth',
      year: '2016',
      summary: 'A phone booth.',
      links: [{ label: 'Source', url: 'https://example.com/source' }],
    },
    body: 'Body text.',
  });
  expect(out).toContain('# Telephone Booth (2016)');
  expect(out).toContain('A phone booth.');
  expect(out).toContain('- [Source](https://example.com/source)');
  expect(out).toContain('Body text.');
});
