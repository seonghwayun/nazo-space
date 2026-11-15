/**
 * Pure helpers for scripts/import-nazoma.mjs (xlsx purchase list + nazo.life
 * nazoma catalog → new nazos). No I/O here so it can be unit tested.
 */

export type SheetRow = Record<string, string>;
export type NazomaItem = { title: string; maker: string; imageUrl?: string };
export type ImportCandidate = {
  title: string;
  maker: string;
  imageUrl: string;
  estimatedTime?: string;
};
export type ExistingCreator = { id: string; name: string };
export type ResolvedCreator = { name: string; existingId?: string };

export function normalizeTitle(s: string): string {
  return (s || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

/** Creator names: like titles, but also ignore "_" "-" "・" ("4CE Dimension" = "4CE_Dimension"). */
export function normalizeName(s: string): string {
  return normalizeTitle(s).replace(/[_\-・]/g, "");
}

/** Collaborations ("A＆B", "A&B&C", "A＋B") become separate creators; overrides win. */
export function splitMakers(maker: string, overrides: Record<string, string[]>): string[] {
  const override = overrides[maker];
  if (override) return override;
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of maker) {
    if (ch === "(" || ch === "（") depth++;
    else if ((ch === ")" || ch === "）") && depth > 0) depth--;
    if (depth === 0 && "&＆+＋".includes(ch)) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((m) => m.trim()).filter(Boolean);
}

/** Link to an existing creator when the normalized name matches; dedupe the rest. */
export function resolveCreators(names: string[], existing: ExistingCreator[]): ResolvedCreator[] {
  const byName = new Map(existing.map((c) => [normalizeName(c.name), c]));
  const seen = new Set<string>();
  const out: ResolvedCreator[] = [];
  for (const raw of names) {
    const name = raw.trim();
    const key = normalizeName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const hit = byName.get(key);
    out.push(hit ? { name: hit.name, existingId: hit.id } : { name });
  }
  return out;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

/** Minimal reader for xl/sharedStrings.xml + xl/worksheets/sheetN.xml. Returns rows keyed by column letter. */
export function parseSheet(sharedXml: string, sheetXml: string): SheetRow[] {
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
  );
  const rows: SheetRow[] = [];
  for (const row of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const r: SheetRow = {};
    for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const col = attrs.match(/\br="([A-Z]+)\d+"/)?.[1];
      const v = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (!col || v === undefined) continue;
      r[col] = /\bt="s"/.test(attrs) ? shared[Number(v)] : decodeXml(v);
    }
    rows.push(r);
  }
  return rows;
}

function grams(s: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= s.length; i++) out.push(s.slice(i, i + n));
  return out.length ? out : [s];
}

/** Average of character and bigram Dice overlap (catches swapped kana like めるくめる/めくるめく). */
function similarity(a: string, b: string): number {
  return (dice(grams(a, 1), grams(b, 1)) + dice(grams(a, 2), grams(b, 2))) / 2;
}

function dice(x: string[], y: string[]): number {
  const pool = [...y];
  let hits = 0;
  for (const g of x) {
    const i = pool.indexOf(g);
    if (i >= 0) {
      hits++;
      pool.splice(i, 1);
    }
  }
  return (2 * hits) / (x.length + y.length);
}

/**
 * Data rows (title in column B, seller in C, estimated time in M) → what to import.
 * Only exact (normalized) title matches — or titleAliases (sheet title → catalog title) — are imported;
 * everything else is reported.
 */
export type PlanOptions = {
  /** xlsx title → catalog title, for sheet typos. */
  titleAliases?: Record<string, string>;
  /** Sheet titles missing from the catalog to import anyway (maker = column C, no image). */
  manualTitles?: string[];
  /** Titles (sheet or catalog) never to import, e.g. bundle sets. */
  excludeTitles?: string[];
  /**
   * Set title (sheet or catalog) → titles of the works inside. Each work uses its
   * catalog item when there is one, otherwise the set's maker and image.
   */
  expand?: Record<string, string[]>;
};

export function planImport(
  rows: SheetRow[],
  items: NazomaItem[],
  existingTitles: string[],
  { titleAliases = {}, manualTitles = [], excludeTitles = [], expand = {} }: PlanOptions = {}
) {
  const aliases = new Map(Object.entries(titleAliases).map(([from, to]) => [normalizeTitle(from), normalizeTitle(to)]));
  const manual = new Set(manualTitles.map(normalizeTitle));
  const exclude = new Set(excludeTitles.map(normalizeTitle));
  const expansions = new Map(Object.entries(expand).map(([set, works]) => [normalizeTitle(set), works]));
  const itemByTitle = new Map<string, NazomaItem>();
  for (const it of items) {
    const key = normalizeTitle(it.title);
    if (!itemByTitle.has(key)) itemByTitle.set(key, it);
  }
  const inDb = new Set(existingTitles.map(normalizeTitle));
  const seen = new Set<string>();

  const toImport: ImportCandidate[] = [];
  const alreadyInDb: string[] = [];
  const excluded: string[] = [];
  const unmatched: { title: string; seller?: string; closest?: string }[] = [];

  const add = (item: NazomaItem, time?: string) => {
    const key = normalizeTitle(item.title);
    if (inDb.has(key)) {
      alreadyInDb.push(item.title);
      return;
    }
    const candidate: ImportCandidate = { title: item.title, maker: item.maker, imageUrl: item.imageUrl || "" };
    if (time) candidate.estimatedTime = time;
    toImport.push(candidate);
  };

  for (const row of rows) {
    const title = row.B?.trim();
    if (!title) continue;
    const raw = normalizeTitle(title);
    const key = aliases.get(raw) ?? raw;
    if (seen.has(key)) continue;
    seen.add(key);

    const catalogItem = itemByTitle.get(key);
    if (exclude.has(key) || exclude.has(raw)) {
      excluded.push(catalogItem?.title ?? title);
      continue;
    }
    const works = expansions.get(key) ?? expansions.get(raw);
    if (works) {
      const setMaker = catalogItem?.maker ?? row.C?.trim() ?? "";
      for (const work of works) {
        const workKey = normalizeTitle(work);
        if (seen.has(workKey)) continue;
        seen.add(workKey);
        add(itemByTitle.get(workKey) ?? { title: work, maker: setMaker, imageUrl: catalogItem?.imageUrl || "" });
      }
      continue;
    }
    const item: NazomaItem | undefined =
      catalogItem ?? (manual.has(raw) ? { title, maker: row.C?.trim() || "", imageUrl: "" } : undefined);
    if (!item) {
      let closest: string | undefined;
      let best = 0;
      for (const it of items) {
        const score = similarity(key, normalizeTitle(it.title));
        if (score > best) {
          best = score;
          closest = it.title;
        }
      }
      unmatched.push({ title, seller: row.C, closest });
      continue;
    }
    add(item, row.M?.trim());
  }
  return { toImport, alreadyInDb, excluded, unmatched };
}
