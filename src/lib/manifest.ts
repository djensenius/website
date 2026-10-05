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
  collection?: 'pages' | 'projects';
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
    date?: Date | string;
    summary?: string;
    media?: FsNode['media'];
  };
};
export function sortPages<T extends PageInput>(pages: T[]): T[] {
  return [...pages].sort((a, b) => a.data.order - b.data.order);
}

function dateValue(date: Date | string | undefined): number {
  if (!date) return Number.NaN;
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

// Projects are listed newest-first: entries with no year (ongoing work) sort to
// the very top, then descending by year. Within a year, dated entries sort by
// date descending before falling back to descending id as a stable tiebreak.
export function sortProjects<T extends ProjectInput>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const ay = a.data.year ?? Number.POSITIVE_INFINITY;
    const by = b.data.year ?? Number.POSITIVE_INFINITY;
    if (ay !== by) return by - ay;

    const at = dateValue(a.data.date);
    const bt = dateValue(b.data.date);
    const aDated = !Number.isNaN(at);
    const bDated = !Number.isNaN(bt);
    if (aDated && bDated && at !== bt) return bt - at;
    if (aDated !== bDated) return aDated ? -1 : 1;

    return b.id.localeCompare(a.id);
  });
}

function pageNode(entry: PageInput): FsNode {
  return {
    path: `/info/${entry.id}`,
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

/**
 * Assemble the virtual filesystem manifest from already-fetched collection entries.
 * The info directory and its pages come first, followed by projects newest-first.
 * Ordering is deterministic so navigation and generated HTML are stable.
 * Pure and runtime-agnostic so it can be unit-tested without astro:content.
 */
export function assembleManifest(
  pages: PageInput[],
  projects: ProjectInput[],
  now: Date = new Date(),
): FilesystemManifest {
  const nodes: FsNode[] = [
    { path: '/info', name: 'info', kind: 'dir' },
    ...sortPages(pages).map(pageNode),
    { path: '/projects', name: 'projects', kind: 'dir' },
    ...sortProjects(projects).map(projectNode),
  ];
  return { generatedAt: now.toISOString(), nodes };
}

/** Files only, in manifest order — handy for building routes and listings. */
export function fileNodes(manifest: FilesystemManifest): FsNode[] {
  return manifest.nodes.filter((n) => n.kind === 'file');
}
