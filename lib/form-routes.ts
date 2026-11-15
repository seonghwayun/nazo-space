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
 * Tracks whether the user has navigated inside the app in this tab.
 * `window.history.length` can't tell: it also counts other sites' pages.
 */
export function createNavigationTracker() {
  let firstPathname: string | null = null;
  let navigated = false;
  return {
    onPathname(pathname: string) {
      if (firstPathname === null) firstPathname = pathname;
      else if (pathname !== firstPathname) navigated = true;
    },
    hasInAppHistory: () => navigated,
  };
}

/** App-wide tracker, fed by <NavigationTracker /> in the root layout. */
export const navigationTracker = createNavigationTracker();

/**
 * Go back if the user got here by navigating inside the app,
 * otherwise replace with `fallback` (e.g. an edit URL opened directly).
 */
export function goBackOr(
  router: { back(): void; replace(href: string): void },
  fallback: string,
  hasInAppHistory: boolean = navigationTracker.hasInAppHistory()
): void {
  if (hasInAppHistory) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
