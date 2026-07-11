import type { APIRoute } from 'astro';
import { absoluteSiteUrl } from '../lib/seo';

// Dynamic robots.txt so the sitemap URL follows SITE_URL/BASE_PATH (production
// custom domain at '/', or the GitHub Pages preview under a project subpath).
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response('robots.txt requires the Astro site config to be set.', { status: 500 });
  }

  const base = import.meta.env.BASE_URL || '/';
  const sitemap = absoluteSiteUrl('/sitemap-index.xml', site.href, base);

  // All crawlers, including AI agents, are welcome to index the whole site.
  const aiBots = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended',
  ];

  const body = [
    'User-agent: *',
    'Disallow:',
    '',
    '# AI crawlers — explicitly allowed so the site can surface in AI answers.',
    ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, 'Disallow:', '']),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
