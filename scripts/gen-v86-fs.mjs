// Generate the v86 emulator's 9p filesystem from the Markdown content
// collections (issue #37). Markdown stays the single source of truth: this
// reuses buildContentTree() (the same rendering path as the legacy disk image)
// and emits v86's JSON/HTTP 9p filesystem format:
//
//   public/emulator/v86/fs.json        — filesystem index (fs2json.py "version 3")
//   public/emulator/v86/fs/<hash>.bin  — file bodies, addressed by sha256 prefix
//
// v86 mounts this over 9p and loads file bodies from `fs/` on demand. See
// tools/fs2json.py in the v86 repo for the reference format.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContentTree } from './gen-emulator-content.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// POSIX st_mode: type bits OR'd with permission bits.
const S_IFREG = 0x8000;
const S_IFDIR = 0x4000;
const FILE_MODE = S_IFREG | 0o644;
const DIR_MODE = S_IFDIR | 0o755;
// Fixed timestamp keeps the output deterministic across builds.
const MTIME = 0;
const HASH_LENGTH = 8;
const VERSION = 3;

// Node layout (trailing null fields trimmed): [name, size, mtime, mode, uid, gid, target].
// For files `target` is the `<hash>.bin` body filename; for directories it is the
// child-node array.
function makeNode(name, size, mode, target) {
  return [name, size, MTIME, mode, 0, 0, target];
}

/**
 * Convert an in-memory content tree (`[{ path, contents }]`) into v86's 9p
 * filesystem representation. Returns the parsed `fs.json` object and a
 * `Map<filename, Buffer>` of file bodies to write under `fs/`.
 */
export function buildFs(tree) {
  const root = [];
  const dirChildren = new Map([['', root]]);
  const store = new Map();
  let totalSize = 0;

  const ensureDir = (relDir) => {
    if (dirChildren.has(relDir)) return dirChildren.get(relDir);
    const slash = relDir.lastIndexOf('/');
    const parent = slash === -1 ? '' : relDir.slice(0, slash);
    const name = slash === -1 ? relDir : relDir.slice(slash + 1);
    const children = [];
    ensureDir(parent).push(makeNode(name, 0, DIR_MODE, children));
    dirChildren.set(relDir, children);
    return children;
  };

  // Sort by path so directory nodes and their children are emitted deterministically.
  const files = [...tree].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const { path: rel, contents } of files) {
    const buf = Buffer.from(contents, 'utf8');
    const hash = createHash('sha256').update(buf).digest('hex');
    const filename = `${hash.slice(0, HASH_LENGTH)}.bin`;
    const existing = store.get(filename);
    if (existing && !existing.equals(buf)) {
      throw new Error(`Short-hash collision on ${filename}; increase HASH_LENGTH`);
    }
    store.set(filename, buf);

    const slash = rel.lastIndexOf('/');
    const dir = slash === -1 ? '' : rel.slice(0, slash);
    const name = slash === -1 ? rel : rel.slice(slash + 1);
    ensureDir(dir).push(makeNode(name, buf.length, FILE_MODE, filename));
    totalSize += buf.length;
  }

  return { fsjson: { fsroot: root, version: VERSION, size: totalSize }, store };
}

function main() {
  const outDir = process.argv[2] ?? join(repoRoot, 'public', 'emulator', 'v86');
  const fsDir = join(outDir, 'fs');

  const { fsjson, store } = buildFs(buildContentTree());

  // Fresh body store; leave sibling assets (wasm, bios, bzimage) untouched.
  if (existsSync(fsDir)) rmSync(fsDir, { recursive: true, force: true });
  mkdirSync(fsDir, { recursive: true });
  for (const [filename, buf] of store) writeFileSync(join(fsDir, filename), buf);
  writeFileSync(join(outDir, 'fs.json'), JSON.stringify(fsjson));

  const bodyCount = readdirSync(fsDir).length;
  console.log(`Generated fs.json (${fsjson.size} bytes, ${bodyCount} bodies) into ${outDir}`);
}

// Only run when invoked directly (not when imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
