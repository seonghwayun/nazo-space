// Pure helpers (no imports) so they can be unit-tested with `node --test`.

const OBJECT_ID = /^[0-9a-f]{24}$/i;

export function isObjectIdHex(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID.test(value);
}

/**
 * R2 key for a nazo image: `nazo/<nazoId>.<ext>`. One file per nazo; a new
 * upload overwrites it, so the stored URL carries a version (see
 * `versionedImageUrl`) to get past caches.
 */
export function nazoImageKey(nazoId: string, ext: string): string {
  if (!isObjectIdHex(nazoId)) throw new Error(`invalid nazo id: ${nazoId}`);
  if (!/^[a-z0-9]+$/.test(ext)) throw new Error(`invalid extension: ${ext}`);
  return `nazo/${nazoId.toLowerCase()}.${ext}`;
}

/** The nazo id a key belongs to, or null for other keys (e.g. the old `nazo/<uuid>.<ext>` layout). */
export function nazoIdFromImageKey(key: string): string | null {
  const m = /^nazo\/([0-9a-f]{24})\.[a-z0-9]+$/i.exec(key);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Public URL plus `?v=<version>`. Images are served as immutable, so the
 * version is what makes browsers, the CDN and next/image fetch a replaced image.
 */
export function versionedImageUrl(publicUrl: string, version: number): string {
  return `${publicUrl}?v=${version.toString(36)}`;
}
