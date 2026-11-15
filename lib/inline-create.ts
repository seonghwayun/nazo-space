// Pure helpers (no imports) so they can be unit-tested with `node --test`.

export type NamedEntity = { _id: string; name: string };

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Offer "'<query>' 새로 만들기" only when no result has exactly that name. */
export function shouldOfferCreate(query: string, results: { name: string }[]): boolean {
  const q = normalize(query);
  if (!q) return false;
  return !results.some((r) => normalize(r.name) === q);
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // ignore non-JSON bodies
  }
  return fallback;
}

async function postName(url: string, name: string, fetchImpl: typeof fetch): Promise<Response> {
  return fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function createCreatorByName(
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<NamedEntity> {
  const res = await postName("/api/creator", name.trim(), fetchImpl);
  if (!res.ok) throw new Error(await errorMessage(res, "제작자 추가에 실패했습니다."));
  return res.json();
}

/** Creates a tag; if it already exists (409), returns the existing one instead. */
export async function createTagByName(
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<NamedEntity> {
  const trimmed = name.trim();
  const res = await postName("/api/tag", trimmed, fetchImpl);
  if (res.ok) return res.json();

  if (res.status === 409) {
    const search = await fetchImpl(`/api/tag?q=${encodeURIComponent(trimmed)}`);
    if (search.ok) {
      const { results } = (await search.json()) as { results: NamedEntity[] };
      const existing = results?.find((t) => normalize(t.name) === normalize(trimmed));
      if (existing) return existing;
    }
  }
  throw new Error(await errorMessage(res, "태그 추가에 실패했습니다."));
}
