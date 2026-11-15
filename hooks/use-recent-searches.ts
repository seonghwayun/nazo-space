"use client";

import * as React from "react";
import {
  RECENT_SEARCHES_KEY,
  addRecentSearch,
  parseRecentSearches,
  removeRecentSearch,
} from "@/lib/recent-searches";

/** Recent search terms, kept in this browser only. */
export function useRecentSearches() {
  const [list, setList] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      // Read after mount: storage isn't available during the server render.
      setList(parseRecentSearches(localStorage.getItem(RECENT_SEARCHES_KEY)));
    } catch {
      // Storage blocked: start empty.
    }
  }, []);

  const update = React.useCallback((next: (prev: string[]) => string[]) => {
    setList((prev) => {
      const value = next(prev);
      try {
        if (value.length) localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(value));
        else localStorage.removeItem(RECENT_SEARCHES_KEY);
      } catch {
        // Storage blocked: keep it for this visit only.
      }
      return value;
    });
  }, []);

  return {
    recent: list,
    remember: React.useCallback((term: string) => update((prev) => addRecentSearch(prev, term)), [update]),
    forget: React.useCallback((term: string) => update((prev) => removeRecentSearch(prev, term)), [update]),
    clear: React.useCallback(() => update(() => []), [update]),
  };
}
