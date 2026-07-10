import type { RSSFeedItem } from '@astrojs/rss';
import { sortProjects, type ProjectInput } from './manifest';

export const feedTitle = 'David Jensenius';
export const feedDescription =
  'Projects and writing by David Jensenius, composer and media artist.';

export function siteWithBase(site: URL, base: string): URL {
  return new URL(base, site);
}

export function projectPubDate(project: ProjectInput): Date | undefined {
  return project.data.year ? new Date(Date.UTC(project.data.year, 0, 1)) : undefined;
}

export function projectLink(project: ProjectInput): string {
  return `files/projects/${project.id}`;
}

export function projectsToRssItems<T extends ProjectInput>(projects: T[]): RSSFeedItem[] {
  return sortProjects(projects).map((project) => ({
    title: project.data.title,
    description: project.data.summary,
    link: projectLink(project),
    pubDate: projectPubDate(project),
  }));
}
