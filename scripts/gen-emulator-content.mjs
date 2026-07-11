// Render the emulator's content tree from the Markdown content collections.
// Markdown stays the single source of truth: this strips frontmatter and
// produces `.md` entries mirroring the virtual filesystem, consumed by the v86
// 9p filesystem generator (gen-v86-fs.mjs). Shipping Markdown (rather than plain
// text) lets the guest's `bat` syntax-highlight it.
//
// Layout produced by buildContentTree():
//   info/bio.md  info/cv-art.md  info/cv-tech.md  info/contact.md  (from src/content/pages)
//   projects/<id>.md                                               (from src/content/projects)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(repoRoot, 'src', 'content');

/** Split frontmatter from body. Frontmatter is the block between the first two `---`. */
export function parse(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: md.trim() };
  return { fm: parseFrontmatter(m[1]), body: m[2].trim() };
}

// Minimal YAML reader for this repo's frontmatter: scalar `key: value` pairs
// plus the `links:` list of `{ label, url }` items. Other list-style keys such
// as `tags:` are intentionally ignored — they aren't needed in the plain-text
// emulator output. Not a general YAML parser.
export function parseFrontmatter(src) {
  const fm = {};
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    if (key === 'links' && rawValue === '') {
      const links = [];
      let cur = null;
      for (let j = i + 1; j < lines.length; j++) {
        const item = lines[j];
        const label = item.match(/^\s*-\s*label:\s*(.*)$/);
        const url = item.match(/^\s*url:\s*(.*)$/);
        if (label) {
          cur = { label: label[1].trim() };
          links.push(cur);
        } else if (url && cur) {
          cur.url = url[1].trim();
        } else if (/^\S/.test(item)) {
          break;
        }
      }
      fm.links = links;
      continue;
    }
    if (rawValue !== '') fm[key] = rawValue.trim();
  }
  return fm;
}

function readCollection(name) {
  const dir = join(contentDir, name);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort() // Deterministic order — readdirSync order is not guaranteed.
    .map((f) => {
      const id = f.replace(/\.md$/, '');
      return { id, ...parse(readFileSync(join(dir, f), 'utf8')) };
    });
}

/** Render a page entry to the Markdown body served in the emulator. */
export function renderPage(page) {
  const title = page.fm.title ?? page.id;
  return `# ${title}\n\n${page.body}\n`;
}

export function renderProject(project) {
  const header = project.fm.year
    ? `${project.fm.title} (${project.fm.year})`
    : (project.fm.title ?? project.id);
  const summary = project.fm.summary ? `${project.fm.summary}\n\n` : '';
  const links = (project.fm.links ?? []).map((link) => `- [${link.label}](${link.url})`).join('\n');
  const linksBlock = links ? `${links}\n\n` : '';
  return `# ${header}\n\n${summary}${linksBlock}${project.body}\n`;
}

/**
 * Build the emulator's virtual filesystem in memory: an array of
 * `{ path, contents }` entries mirroring the on-disk layout. The v86 9p
 * filesystem generator (`gen-v86-fs.mjs`) consumes this, keeping a single
 * rendering path from Markdown.
 */
export function buildContentTree() {
  const files = [];
  const push = (path, contents) => {
    files.push({ path, contents: contents.endsWith('\n') ? contents : `${contents}\n` });
  };
  for (const page of readCollection('pages')) push(`info/${page.id}.md`, renderPage(page));
  for (const project of readCollection('projects')) {
    push(`projects/${project.id}.md`, renderProject(project));
  }
  return files;
}
