import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { feedDescription, feedTitle, projectsToRssItems, siteWithBase } from '../lib/rss';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('RSS feed requires the Astro site config to be set.', { status: 500 });
  }

  const projects = await getCollection('projects');

  return rss({
    title: feedTitle,
    description: feedDescription,
    site: siteWithBase(site, import.meta.env.BASE_URL),
    items: projectsToRssItems(projects),
  });
};
