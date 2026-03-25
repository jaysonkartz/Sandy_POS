/**
 * URL prefixes for admin-only UI (route groups do not affect URLs).
 * Keep in sync with app/(admin)/ layout coverage.
 */
export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/management",
  "/admin",
  "/pricing-management",
] as const;

/** Paths where proxy skips admin role checks (session refresh still runs). */
export const PROXY_AUTH_EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/unauthorized",
  "/403",
  "/api",
  "/_next",
  "/favicon.ico",
] as const;

export function isAdminRoutePath(pathname: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isProxyAuthExcludedPath(pathname: string): boolean {
  return PROXY_AUTH_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
