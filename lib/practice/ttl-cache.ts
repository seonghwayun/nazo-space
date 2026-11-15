// Pure helper (no imports) so it can be unit-tested with `node --test`.

/**
 * Memoizes an async loader for `ttlMs`. Concurrent callers share one load.
 * Neither a failure nor a null result is cached: an empty DB right before an
 * import must not keep answering "no puzzles" for the whole TTL.
 */
export function createTtlCache<T>(
  load: () => Promise<T | null>,
  ttlMs: number,
  now: () => number = Date.now
): () => Promise<T | null> {
  let cached: { value: T; loadedAt: number } | null = null;
  let loading: Promise<T | null> | null = null;

  return () => {
    if (cached && now() - cached.loadedAt < ttlMs) return Promise.resolve(cached.value);
    if (!loading) {
      loading = load()
        .then((value) => {
          if (value !== null) cached = { value, loadedAt: now() };
          return value;
        })
        .finally(() => {
          loading = null;
        });
    }
    return loading;
  };
}
