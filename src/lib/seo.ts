export function normalizeBasePath(base = '/'): string {
  return `/${base.replace(/^\/+|\/+$/g, '')}/`.replace(/\/{2,}/g, '/');
}

export function absoluteSiteUrl(value: string, site: string, base = '/'): string {
  if (/^https?:\/\//i.test(value)) return value;

  const basePath = normalizeBasePath(base);
  const baseSegment = basePath.replace(/^\/+|\/+$/g, '');
  const cleanValue = value.replace(/^\/+/, '');

  if (baseSegment && (cleanValue === baseSegment || cleanValue.startsWith(`${baseSegment}/`))) {
    return new URL(`/${cleanValue}`, site).href;
  }

  return new URL(`${basePath}${cleanValue}`, site).href;
}
