// Pure helpers (no imports) so they can be unit-tested with `node --test`.

/** Escape user input for use inside a RegExp / MongoDB $regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Put the exact-name match first (adding it if the capped results missed it), without duplicates. */
export function mergeExactFirst<T extends { _id: unknown }>(exact: T | null, results: T[]): T[] {
  if (!exact) return results;
  const exactId = String(exact._id);
  return [exact, ...results.filter((r) => String(r._id) !== exactId)];
}
