import { expect, test } from 'vitest';
import {
  assembleManifest,
  fileNodes,
  sortProjects,
  type PageInput,
  type ProjectInput,
} from './manifest';

const pages: PageInput[] = [
  { id: 'contact', data: { title: 'contact', order: 3 } },
  { id: 'bio', data: { title: 'bio', order: 1 } },
  { id: 'cv', data: { title: 'cv', order: 2 } },
];

const projects: ProjectInput[] = [
  { id: 'ongoing-foundsounds', data: { title: 'Ongoing - FoundSounds' } },
  { id: '2016-telephone-booth', data: { title: 'Telephone Booth', year: 2016 } },
  { id: '2004-of-dinger', data: { title: 'of Dinger', year: 2004 } },
];

const now = new Date('2024-01-01T00:00:00.000Z');

test('pages are ordered by their order field', () => {
  const { nodes } = assembleManifest(pages, projects, now);
  const pagePaths = nodes.filter((n) => n.collection === 'pages').map((n) => n.path);
  expect(pagePaths).toEqual(['/info/bio', '/info/cv', '/info/contact']);
});

test('projects sort newest-first: no-year first, then year desc, then id desc', () => {
  const sorted = sortProjects(projects).map((p) => p.id);
  expect(sorted).toEqual(['ongoing-foundsounds', '2016-telephone-booth', '2004-of-dinger']);
});

test('info appears first, then projects and their files', () => {
  const { nodes } = assembleManifest(pages, projects, now);
  const infoDirIdx = nodes.findIndex((n) => n.path === '/info');
  const firstPageIdx = nodes.findIndex((n) => n.collection === 'pages');
  const projectsDirIdx = nodes.findIndex((n) => n.path === '/projects');
  const firstProjectIdx = nodes.findIndex((n) => n.collection === 'projects');
  expect(infoDirIdx).toBe(0);
  expect(infoDirIdx).toBeLessThan(firstPageIdx);
  expect(firstPageIdx).toBeLessThan(projectsDirIdx);
  expect(projectsDirIdx).toBeLessThan(firstProjectIdx);
});

test('file paths are namespaced by collection', () => {
  const { nodes } = assembleManifest(pages, projects, now);
  expect(nodes.find((n) => n.entryId === '2004-of-dinger')?.path).toBe('/projects/2004-of-dinger');
  expect(nodes.find((n) => n.entryId === 'bio')?.path).toBe('/info/bio');
});

test('fileNodes excludes directories', () => {
  const manifest = assembleManifest(pages, projects, now);
  const files = fileNodes(manifest);
  expect(files.every((n) => n.kind === 'file')).toBe(true);
  expect(files).toHaveLength(pages.length + projects.length);
});

test('generatedAt reflects the provided clock', () => {
  const { generatedAt } = assembleManifest(pages, projects, now);
  expect(generatedAt).toBe('2024-01-01T00:00:00.000Z');
});
