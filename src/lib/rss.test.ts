import { expect, test } from 'vitest';
import { projectLink, projectPubDate, projectsToRssItems, siteWithBase } from './rss';
import type { ProjectInput } from './manifest';

const projects: ProjectInput[] = [
  { id: '2016-telephone-booth', data: { title: 'Telephone Booth', year: 2016, summary: 'Phone.' } },
  { id: 'ongoing-foundsounds', data: { title: 'Ongoing - FoundSounds', summary: 'Social.' } },
  { id: '2026-telephone-booth', data: { title: "Telephone Booth (St. Anne's)", year: 2026 } },
];

test('project RSS items use files routes in manifest order', () => {
  expect(projectsToRssItems(projects)).toMatchObject([
    { title: 'Ongoing - FoundSounds', link: 'files/projects/ongoing-foundsounds' },
    { title: "Telephone Booth (St. Anne's)", link: 'files/projects/2026-telephone-booth' },
    { title: 'Telephone Booth', link: 'files/projects/2016-telephone-booth' },
  ]);
});

test('project RSS dates come from the project year when present', () => {
  expect(projectPubDate(projects[0])?.toISOString()).toBe('2016-01-01T00:00:00.000Z');
  expect(projectPubDate(projects[1])).toBeUndefined();
});

test('project RSS links and site URL honor Astro base paths', () => {
  expect(projectLink(projects[0])).toBe('files/projects/2016-telephone-booth');
  expect(siteWithBase(new URL('https://example.com'), '/website/').href).toBe(
    'https://example.com/website/',
  );
});
