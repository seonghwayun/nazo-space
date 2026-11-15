// Pure helpers (no imports) so they can be unit-tested with `node --test`.

const FORM_ROUTE_PATTERNS = [
  /^\/nazo\/[^/]+\/(review|edit)$/,
  /^\/creator\/[^/]+\/edit$/,
  /^\/admin\/(nazo|creator|tag)\/new$/,
];

/** Routes rendered as full-screen forms: header and bottom nav are hidden. */
export function isFullScreenFormRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return FORM_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Go back if there is in-app history, otherwise replace with `fallback`
 * (e.g. when an edit URL was opened directly in a new tab).
 */
export function goBackOr(
  router: { back(): void; replace(href: string): void },
  fallback: string,
  historyLength: number = typeof window === "undefined" ? 1 : window.history.length
): void {
  if (historyLength > 1) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
