const defaultPlausibleSrc = 'https://plausible.io/js/script.js';

type AnalyticsOptions = {
  domain: string | undefined;
  src: string | undefined;
  baseUrl: string;
  dev: boolean;
};

export type AnalyticsConfig = {
  domain: string;
  src: string;
};

export function resolveAnalyticsConfig({
  domain,
  src,
  baseUrl,
  dev,
}: AnalyticsOptions): AnalyticsConfig | undefined {
  const plausibleDomain = domain?.trim();
  if (!plausibleDomain) return undefined;

  const plausibleSrc = src?.trim();
  return {
    domain: plausibleDomain,
    src: plausibleSrc ? validateScriptSrc(plausibleSrc, baseUrl, dev) : defaultPlausibleSrc,
  };
}

function validateScriptSrc(src: string, baseUrl: string, dev: boolean): string {
  if (isRootRelativePath(src)) return joinBasePath(baseUrl, src);
  if (isAllowedAbsoluteUrl(src, dev)) return src;
  throw new Error(
    'Invalid PUBLIC_PLAUSIBLE_SRC. Use an absolute https:// URL or root-relative /path. http:// is allowed only during local dev.',
  );
}

function isRootRelativePath(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//');
}

function isAllowedAbsoluteUrl(src: string, dev: boolean): boolean {
  try {
    const { hostname, protocol } = new URL(src);
    if (!hostname) return false;
    if (protocol === 'https:') return src.toLowerCase().startsWith('https://');
    return dev && protocol === 'http:' && src.toLowerCase().startsWith('http://');
  } catch {
    return false;
  }
}

function joinBasePath(baseUrl: string, src: string): string {
  return `${baseUrl}/${src.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
}
