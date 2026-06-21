const AUTH_ROUTE_PATTERN =
  /^\/(buyer|seller)\/(signin|signup|verify-email|forgot-password|reset-password)(\/|$)/

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTE_PATTERN.test(pathname)
}

export function showMarketplaceChrome(pathname: string) {
  if (pathname.startsWith('/admin/')) return false
  if (pathname.startsWith('/seller/')) return false
  if (isAuthRoute(pathname)) return false
  return true
}
