import type { APIRoute } from 'astro';
import { absoluteSiteUrl } from '../lib/seo';

// Dynamic llms.txt (the emerging AI-agent convention): a clean Markdown summary
// with absolute links that follow SITE_URL/BASE_PATH across production/preview.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL || '/';
  const origin = site?.href ?? 'https://david.jensenius.com/';
  const url = (path: string) => absoluteSiteUrl(path, origin, base);

  const body = `# David Jensenius

> David Jensenius is a Canadian composer and media artist working with sound, performance, installation, and custom software. His work turns obsolete technologies and everyday encounters into sites of chance, intimacy, and emergent dialogue, exhibited and performed across Canada and internationally.

The site is a portfolio presented two ways from a single Markdown source: an in-browser Linux terminal emulator and a plain, accessible file-navigation view. Every page below is a crawlable static URL.

## About
- [Bio](${url('/files/info/bio')}): Artist biography.
- [CV — Art](${url('/files/info/cv-art')}): Exhibitions, performances, and art practice.
- [CV — Tech](${url('/files/info/cv-tech')}): Technical and software work.
- [Contact](${url('/files/info/contact')}): How to get in touch.

## Selected works
- [Telephone Booth (2026)](${url('/files/projects/2026-telephone-booth')}): Rotary pay-phone installation for emergent, decontextualized dialogue.
- [Untitled (2020)](${url('/files/projects/2020-untitled')}): Graphical score.
- [FoundSounds (2015)](${url('/files/projects/2015-foundsounds')}): International collaborative art project disguised as a social network.
- [Telephone Booth (2016)](${url('/files/projects/2016-telephone-booth')}): The original rotary pay-phone installation, CAFKA 2016.

## More
- [All works and files](${url('/files/')}): Full, browsable list of projects and pages.
- [GitHub](https://github.com/djensenius): Source code for many of the works.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
