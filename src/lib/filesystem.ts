import { getCollection } from 'astro:content';
import { assembleManifest, type FilesystemManifest } from './manifest';

export type { FsNode, FilesystemManifest } from './manifest';
export { fileNodes } from './manifest';

/**
 * Walk the content collections and build the site's virtual filesystem manifest
 * (issue #21). Thin astro:content adapter over the pure `assembleManifest` logic.
 */
export async function buildManifest(): Promise<FilesystemManifest> {
  const [pages, projects] = await Promise.all([getCollection('pages'), getCollection('projects')]);
  return assembleManifest(pages, projects);
}
