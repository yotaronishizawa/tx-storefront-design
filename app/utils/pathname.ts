/**
 * Compares a live pathname against a `ROUTES` path. Use it rather than `===`:
 * the live URL may end in a slash, and missing `/restocking/` drops every scan.
 */
export function isSamePathname(pathname: string, routePathname: string) {
  return normalizePathname(pathname) === normalizePathname(routePathname)
}

/** Drops a trailing slash, except on the root path. */
export function normalizePathname(pathname: string) {
  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith("/")
  return hasTrailingSlash ? pathname.slice(0, -1) : pathname
}
