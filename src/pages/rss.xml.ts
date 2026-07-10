import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { feedDescription, feedTitle, projectsToRssItems, siteWithBase } from '../lib/rss';

export async function GET(context: { site: URL }) {
  const projects = await getCollection('projects');

  return rss({
    title: feedTitle,
    description: feedDescription,
    site: siteWithBase(context.site, import.meta.env.BASE_URL),
    items: projectsToRssItems(projects),
  });
}
