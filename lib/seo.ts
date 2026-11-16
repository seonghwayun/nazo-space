// Pure helpers (no imports) for page titles, descriptions and share-preview tags,
// so they can be unit-tested with `node --test`.

export const SITE_NAME = "Nazo Space";
export const SITE_URL = "https://nazo.respace.cc";
const DESCRIPTION_MAX = 155;

/** Cut text to about `max` characters on a word boundary, adding "…" only when it was cut. */
export function truncate(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,·]+$/, "")}…`;
}

export interface NazoSeoInput {
  originalTitle: string;
  translatedTitle?: string | null;
  description?: string | null;
  creators?: { name: string }[];
  tags?: { name: string }[];
  averageRate?: number | null;
  rateCount?: number | null;
  difficulty?: string | null;
  estimatedTime?: string | null;
}

/** "原題 (번역 제목)" — the Korean title is what Korean players search for. */
export function nazoDisplayTitle(nazo: Pick<NazoSeoInput, "originalTitle" | "translatedTitle">): string {
  const translated = nazo.translatedTitle?.trim();
  return translated && translated !== nazo.originalTitle ? `${nazo.originalTitle} (${translated})` : nazo.originalTitle;
}

/** Page title without the site suffix (the layout's title template adds it). */
export function nazoTitle(nazo: NazoSeoInput): string {
  return `${nazoDisplayTitle(nazo)} - 나조토키`;
}

/**
 * A description that differs per nazo even when it has no description of its own:
 * who made it, tags, rating, difficulty, then as much of the description as fits.
 */
export function nazoDescription(nazo: NazoSeoInput): string {
  const creators = (nazo.creators ?? []).map((c) => c.name).filter(Boolean);
  const facts = [
    creators.length ? `${creators.join(", ")} 제작 나조토키` : "나조토키",
    (nazo.rateCount ?? 0) > 0 && nazo.averageRate
      ? `평균 ★${nazo.averageRate.toFixed(1)} (${nazo.rateCount}명)`
      : null,
    nazo.difficulty ? `난이도 ${nazo.difficulty}` : null,
    nazo.estimatedTime ? `예상 ${nazo.estimatedTime}` : null,
    (nazo.tags ?? []).length ? (nazo.tags ?? []).slice(0, 4).map((t) => `#${t.name}`).join(" ") : null,
  ].filter(Boolean);
  const lead = `「${nazoDisplayTitle(nazo)}」 ${facts.join(" · ")}.`;
  const body = nazo.description?.trim();
  return truncate(body ? `${lead} ${body}` : `${lead} 후기와 평점, 플레이 기록을 Nazo Space에서 확인하세요.`);
}

/** Description for a creator or tag page, naming a few of its nazos. */
export function listDescription(kind: "creator" | "tag", name: string, nazoTitles: string[]): string {
  const subject = kind === "creator" ? `${name}에서 제작한 나조토키` : `#${name} 태그의 나조토키`;
  if (nazoTitles.length === 0) return `${subject} 모음. Nazo Space에서 후기와 평점을 확인하세요.`;
  const sample = nazoTitles.slice(0, 3).map((t) => `「${t}」`).join(", ");
  const more = nazoTitles.length > 3 ? ` 등 ${nazoTitles.length}개` : "";
  return truncate(`${subject} ${sample}${more}. 후기와 평점, 플레이 기록을 Nazo Space에서 확인하세요.`);
}

export interface ShareMetaInput {
  title: string; // without the site suffix
  description: string;
  /** e.g. "/nazo/<id>". Left out in the layout, where it would become every page's og:url. */
  path?: string;
  image?: string | null;
  /** The image is a portrait poster: X's large card would crop it to 2:1, so use the small card. */
  poster?: boolean;
}

/**
 * openGraph + twitter for one page. A page that sets `openGraph` replaces the layout's whole
 * object, so siteName / locale / the default image have to be repeated here.
 */
export function shareMeta({ title, description, path, image, poster = false }: ShareMetaInput) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const images = image ? [image] : ["/opengraph-image"];
  return {
    openGraph: {
      title: fullTitle,
      description,
      ...(path ? { url: path } : {}),
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "website" as const,
      images,
    },
    twitter: {
      card: image && poster ? ("summary" as const) : ("summary_large_image" as const),
      title: fullTitle,
      description,
      images,
    },
  };
}

/** title + description + share tags for a page, all from the same strings. */
export function pageMeta(input: ShareMetaInput) {
  return { title: input.title, description: input.description, ...shareMeta(input) };
}
