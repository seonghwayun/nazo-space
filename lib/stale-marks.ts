// Pure helpers (no imports) so they can be unit-tested with `node --test`.

/**
 * Ids whose cached page data is known to be outdated (e.g. right after an edit),
 * so the page refetches once when it is shown again via back navigation.
 */
export function createStaleMarks() {
  const ids = new Set<string>();
  return {
    mark: (id: string) => {
      ids.add(id);
    },
    consume: (id: string): boolean => ids.delete(id),
  };
}

export const staleNazos = createStaleMarks();
