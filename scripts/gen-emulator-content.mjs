// Generate the emulator's plain-text content tree from the Markdown content
// collections (issue #33). Markdown stays the single source of truth: this
// strips frontmatter and writes readable `.txt` files mirroring the virtual
// filesystem, which scripts/build-image.sh injects into the bootable disk image.
//
// Output layout (under the staging dir passed as argv[2], default build/emulator-root):
//   bio.txt  cv.txt  contact.txt        (from src/content/pages)
//   code/repos.txt                      (from src/content/code)
//   projects/<id>.txt                   (from src/content/projects)
//   LICENSE                             (copied from root/LICENSE)
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
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
// plus the `repos:` list of `{ name, url }` items. Other list-style keys such as
// `tags:` are intentionally ignored — they aren't needed in the plain-text
// emulator output. Not a general YAML parser.
export function parseFrontmatter(src) {
  const fm = {};
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    if (key === 'repos' && rawValue === '') {
      const repos = [];
      let cur = null;
      for (let j = i + 1; j < lines.length; j++) {
        const item = lines[j];
        const name = item.match(/^\s*-\s*name:\s*(.*)$/);
        const url = item.match(/^\s*url:\s*(.*)$/);
        if (name) {
          cur = { name: name[1].trim() };
          repos.push(cur);
        } else if (url && cur) {
          cur.url = url[1].trim();
        } else if (/^\S/.test(item)) {
          break;
        }
      }
      fm.repos = repos;
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

function underline(title) {
  return `${title}\n${'='.repeat(title.length)}\n`;
}

function writeFile(outDir, relPath, contents) {
  const full = join(outDir, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents.endsWith('\n') ? contents : `${contents}\n`);
}

/** Render a page/code/project entry to the text body written into the image. */
export function renderPage(page) {
  return `${underline(page.fm.title ?? page.id)}\n${page.body}\n`;
}

export function renderCode(entry) {
  const repos = (entry.fm.repos ?? []).map((r) => `  ${r.name} — ${r.url}`).join('\n');
  const parts = [underline(entry.fm.title ?? entry.id)];
  if (repos) parts.push(`${repos}\n`);
  parts.push(entry.body);
  return `${parts.join('\n')}\n`;
}

export function renderProject(project) {
  const header = project.fm.year
    ? `${project.fm.title} (${project.fm.year})`
    : (project.fm.title ?? project.id);
  const summary = project.fm.summary ? `${project.fm.summary}\n` : '';
  return `${underline(header)}\n${summary}\n${project.body}\n`;
}

/**
 * Build the emulator's virtual filesystem in memory: an array of
 * `{ path, contents }` entries mirroring the on-disk layout. Both the plain-text
 * generator (`main`) and the v86 9p filesystem generator (`gen-v86-fs.mjs`)
 * consume this, keeping a single rendering path from Markdown.
 *
 * `includeLegacyLicense` appends `root/LICENSE` — the JSLinux-derivative notice
 * (with a redistribution prohibition). It belongs in the legacy jslinux disk
 * image only; the modern v86 build documents its licensing separately in
 * public/emulator/v86/THIRD_PARTY_NOTICES.md, so it opts out.
 */
export function buildContentTree({ includeLegacyLicense = true } = {}) {
  const files = [];
  const push = (path, contents) => {
    files.push({ path, contents: contents.endsWith('\n') ? contents : `${contents}\n` });
  };
  for (const page of readCollection('pages')) push(`${page.id}.txt`, renderPage(page));
  for (const entry of readCollection('code')) push(`code/${entry.id}.txt`, renderCode(entry));
  for (const project of readCollection('projects')) {
    push(`projects/${project.id}.txt`, renderProject(project));
  }
  const license = join(repoRoot, 'root', 'LICENSE');
  if (includeLegacyLicense && existsSync(license)) push('LICENSE', readFileSync(license, 'utf8'));
  return files;
}

function main() {
  const outDir = process.argv[2] ?? join(repoRoot, 'build', 'emulator-root');

  // Fresh, deterministic output.
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const files = buildContentTree();
  for (const { path, contents } of files) writeFile(outDir, path, contents);

  const count = files.filter((f) => f.path.endsWith('.txt')).length;
  console.log(`Generated ${count} text files into ${outDir}`);
}

// Only run the build when invoked directly (not when imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
