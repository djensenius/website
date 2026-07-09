// A single node in the site's virtual filesystem. Directories group files;
// files map to a rendered content entry.
export type FsNode = {
  /** Absolute virtual path, e.g. "/projects/2016-telephone-booth". */
  path: string;
  /** Display name (the last path segment for files, dir name for directories). */
  name: string;
  kind: 'dir' | 'file';
  /** Human-friendly title (files only). */
  title?: string;
  /** Owning collection (files only). */
  collection?: 'pages' | 'projects' | 'code';
  /** Content entry id within its collection (files only). */
  entryId?: string;
  /** Year, for projects. */
  year?: number;
  /** Short summary/description, when available. */
  summary?: string;
  /** Media assets attached to the entry (projects only). */
  media?: { type: 'image' | 'audio'; src: string; alt?: string; caption?: string }[];
};

export type FilesystemManifest = {
  generatedAt: string;
  nodes: FsNode[];
};

// Minimal shapes so the ordering/assembly logic can be unit-tested without the
// astro:content runtime.
export type PageInput = {
  id: string;
  data: { title: string; order: number; description?: string };
};
export type ProjectInput = {
  id: string;
  data: {
    title: string;
    year?: number;
    summary?: string;
    media?: FsNode['media'];
  };
};
export type CodeInput = { id: string; data: { title: string } };

export function sortPages<T extends PageInput>(pages: T[]): T[] {
  return [...pages].sort((a, b) => a.data.order - b.data.order);
}

export function sortProjects<T extends ProjectInput>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const ay = a.data.year ?? Number.POSITIVE_INFINITY;
    const by = b.data.year ?? Number.POSITIVE_INFINITY;
    if (ay !== by) return ay - by;
    return a.id.localeCompare(b.id);
  });
}

export function sortCode<T extends CodeInput>(code: T[]): T[] {
  return [...code].sort((a, b) => a.id.localeCompare(b.id));
}

function pageNode(entry: PageInput): FsNode {
  return {
    path: `/${entry.id}`,
    name: entry.id,
    kind: 'file',
    title: entry.data.title,
    collection: 'pages',
    entryId: entry.id,
    summary: entry.data.description,
  };
}

function projectNode(entry: ProjectInput): FsNode {
  return {
    path: `/projects/${entry.id}`,
    name: entry.id,
    kind: 'file',
    title: entry.data.title,
    collection: 'projects',
    entryId: entry.id,
    year: entry.data.year,
    summary: entry.data.summary,
    media: entry.data.media,
  };
}

function codeNode(entry: CodeInput): FsNode {
  return {
    path: `/code/${entry.id}`,
    name: entry.id,
    kind: 'file',
    title: entry.data.title,
    collection: 'code',
    entryId: entry.id,
  };
}

/**
 * Assemble the virtual filesystem manifest from already-fetched collection entries.
 * Pages are top-level "files"; projects and code live under their own directories.
 * Entries are sorted deterministically so navigation and generated HTML are stable.
 * Pure and runtime-agnostic so it can be unit-tested without astro:content.
 */
export function assembleManifest(
  pages: PageInput[],
  projects: ProjectInput[],
  code: CodeInput[],
  now: Date = new Date(),
): FilesystemManifest {
  const nodes: FsNode[] = [
    ...sortPages(pages).map(pageNode),
    { path: '/projects', name: 'projects', kind: 'dir' },
    ...sortProjects(projects).map(projectNode),
    { path: '/code', name: 'code', kind: 'dir' },
    ...sortCode(code).map(codeNode),
  ];
  return { generatedAt: now.toISOString(), nodes };
}

/** Files only, in manifest order — handy for building routes and listings. */
export function fileNodes(manifest: FilesystemManifest): FsNode[] {
  return manifest.nodes.filter((n) => n.kind === 'file');
}
