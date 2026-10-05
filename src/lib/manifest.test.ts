import { expect, test } from 'vitest';
import {
  assembleManifest,
  fileNodes,
  sortProjects,
  type PageInput,
  type ProjectInput,
} from './manifest';

const pages: PageInput[] = [
  { id: 'contact', data: { title: 'contact', order: 5 } },
  { id: 'bio', data: { title: 'bio', order: 1 } },
  { id: 'press', data: { title: 'press', order: 4 } },
  { id: 'cv-art', data: { title: 'cv-art', order: 2 } },
  { id: 'cv-tech', data: { title: 'cv-tech', order: 3 } },
];

const projects: ProjectInput[] = [
  { id: 'ongoing-project', data: { title: 'Ongoing Project' } },
  { id: '2016-telephone-booth', data: { title: 'Telephone Booth', year: 2016 } },
  { id: '2004-of-dinger', data: { title: 'of Dinger', year: 2004 } },
];

const datedProjects: ProjectInput[] = [
  {
    id: '2026-telephone-booth-cambridge',
    data: { title: 'Telephone Booth', year: 2026, date: '2026-09-30' },
  },
  {
    id: '2026-telephone-booth-where-walls-meet-sky',
    data: { title: 'Telephone Booth', year: 2026, date: new Date('2026-08-22') },
  },
  {
    id: '2026-pinch-cabaret',
    data: { title: 'Pinch Cabaret', year: 2026, date: '2026-09-26' },
  },
];

const now = new Date('2024-01-01T00:00:00.000Z');

test('pages are ordered by their order field', () => {
  const { nodes } = assembleManifest(pages, projects, now);
  const pagePaths = nodes.filter((n) => n.collection === 'pages').map((n) => n.path);
  expect(pagePaths).toEqual([
    '/info/bio',
    '/info/cv-art',
    '/info/cv-tech',
    '/info/press',
    '/info/contact',
  ]);
});

test('projects sort newest-first: no-year first, then year desc, then id desc', () => {
  const sorted = sortProjects(projects).map((p) => p.id);
  expect(sorted).toEqual(['ongoing-project', '2016-telephone-booth', '2004-of-dinger']);
});

test('dated projects in the same year sort newest-first', () => {
  const sorted = sortProjects(datedProjects).map((p) => p.id);
  expect(sorted).toEqual([
    '2026-telephone-booth-cambridge',
    '2026-pinch-cabaret',
    '2026-telephone-booth-where-walls-meet-sky',
  ]);
});

test('dated projects sort before undated projects in the same year', () => {
  const sorted = sortProjects([
    { id: '2026-undated', data: { title: 'Undated', year: 2026 } },
    { id: '2026-dated', data: { title: 'Dated', year: 2026, date: '2026-01-01' } },
  ]).map((p) => p.id);
  expect(sorted).toEqual(['2026-dated', '2026-undated']);
});

test('projects with matching dates fall back to id order', () => {
  const sorted = sortProjects([
    { id: '2026-alpha', data: { title: 'Alpha', year: 2026, date: '2026-01-01' } },
    { id: '2026-zulu', data: { title: 'Zulu', year: 2026, date: '2026-01-01' } },
  ]).map((p) => p.id);
  expect(sorted).toEqual(['2026-zulu', '2026-alpha']);
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
