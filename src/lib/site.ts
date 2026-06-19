const DEFAULT_SITE_URL = 'https://main.d13h6a6205mdyf.amplifyapp.com'

export function getSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  if (configured?.trim()) {
    return configured.trim().replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return DEFAULT_SITE_URL
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteOrigin()}${normalized}`
}
