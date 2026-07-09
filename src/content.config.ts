import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// A link rendered alongside a page or project (e.g. "More information").
const link = z.object({
  label: z.string(),
  url: z.string().url(),
});

// A media asset (image or audio) associated with a project. Images require alt
// text for accessibility; audio may omit it.
const media = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('audio'),
    src: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
]);

// Top-level "files" in the site's virtual filesystem: bio, cv, contact.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    // Ordering within the file listing / navigation.
    order: z.number().int().default(0),
    description: z.string().optional(),
  }),
});

// Art projects (the bulk of the portfolio).
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().optional(),
    date: z.coerce.date().optional(),
    summary: z.string().optional(),
    collaborators: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    links: z.array(link).default([]),
    media: z.array(media).default([]),
    status: z.enum(['complete', 'in-progress']).default('complete'),
  }),
});

// Code repositories listing (data-driven).
const code = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/code' }),
  schema: z.object({
    title: z.string(),
    repos: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().url(),
          description: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { pages, projects, code };
