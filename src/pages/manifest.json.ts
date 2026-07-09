import type { APIRoute } from 'astro';
import { buildManifest } from '../lib/filesystem';

// Build-time JSON filesystem manifest (issue #21). Emitted as a static file so the
// client-side file-navigation island and any external consumers can fetch the
// virtual filesystem without re-walking the content collections.
export const GET: APIRoute = async () => {
  const manifest = await buildManifest();
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
