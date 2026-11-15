// Pure helpers (no imports) so they can be unit-tested with `node --test`.

export const RECENT_SEARCHES_KEY = "nazo-recent-searches";
export const RECENT_SEARCHES_MAX = 10;

/** Newest first, no duplicates (case-insensitive), at most RECENT_SEARCHES_MAX. */
export function addRecentSearch(list: string[], term: string): string[] {
  const t = term.trim();
  if (!t) return list;
  return [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, RECENT_SEARCHES_MAX);
}

export function removeRecentSearch(list: string[], term: string): string[] {
  return list.filter((x) => x !== term);
}

/** Stored JSON → list; anything unexpected becomes an empty list. */
export function parseRecentSearches(raw: string | null): string[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, RECENT_SEARCHES_MAX) : [];
  } catch {
    return [];
  }
}
