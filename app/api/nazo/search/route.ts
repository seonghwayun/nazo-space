import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";
import { toKanaPattern } from "@/lib/kana";
import { andAll, nazoListConditions, nazoSort, withNazoStats } from "@/lib/nazo-query";

const NAZO_FIELDS = "originalTitle translatedTitle imageUrl averageRate rateCount creators tags difficulty estimatedTime";
const PAGE = 20;
const BROWSE_LIMIT = 300;

interface NamedRow {
  _id: unknown;
  name: string;
}

function findNamed(kind: "creator" | "tag", filter: Record<string, unknown>, skip: number, limit: number): Promise<NamedRow[]> {
  if (kind === "creator") return Creator.find(filter).select("name").sort({ name: 1 }).skip(skip).limit(limit).lean<NamedRow[]>();
  return Tag.find(filter).select("name").sort({ name: 1 }).skip(skip).limit(limit).lean<NamedRow[]>();
}

/**
 * GET /api/nazo/search
 * - `q`, no `type`: first page of every tab plus `counts` (totals per tab)
 * - `q` + `type=nazo|creator|tag` + `page`: further pages of one tab
 * - no `q` + `type=creator|tag`: browse every creator / tag, most nazos first
 * Nazo matches cover the title and the translated title only (creators have their own tab),
 * honour `unplayedOnly` (see nazoListConditions) and are ordered by `sort` (new|rate|popular).
 * Creators and tags come with `nazoCount` and up to three `posters`.
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const skip = (page - 1) * PAGE;

    if (!query) {
      if (type === "creator" || type === "tag") {
        const rows = await findNamed(type, {}, 0, BROWSE_LIMIT);
        const enriched = (await withNazoStats(type === "creator" ? "creators" : "tags", rows)).sort(
          (a, b) => b.nazoCount - a.nazoCount || a.name.localeCompare(b.name, "ja")
        );
        return NextResponse.json(type === "creator" ? { creators: enriched } : { tags: enriched });
      }
      return NextResponse.json({ nazos: [], creators: [], tags: [] });
    }

    const regex = { $regex: toKanaPattern(query), $options: "i" };
    const nameFilter = { name: regex };

    const buildNazoFilter = async () =>
      andAll({ $or: [{ originalTitle: regex }, { translatedTitle: regex }] }, await nazoListConditions(searchParams));
    const findNazos = (filter: Record<string, unknown>, from: number) =>
      Nazo.find(filter)
        .sort(nazoSort(searchParams.get("sort")))
        .skip(from)
        .limit(PAGE)
        .select(NAZO_FIELDS)
        .populate("creators", "name")
        .lean();

    if (type === "nazo") {
      return NextResponse.json({ nazos: await findNazos(await buildNazoFilter(), skip), creators: [], tags: [] });
    }
    if (type === "creator") {
      const creators = await withNazoStats("creators", await findNamed("creator", nameFilter, skip, PAGE));
      return NextResponse.json({ nazos: [], creators, tags: [] });
    }
    if (type === "tag") {
      const tags = await withNazoStats("tags", await findNamed("tag", nameFilter, skip, PAGE));
      return NextResponse.json({ nazos: [], creators: [], tags });
    }

    const filter = await buildNazoFilter();
    const [nazos, creators, tags, nazoCount, creatorCount, tagCount] = await Promise.all([
      findNazos(filter, 0),
      findNamed("creator", nameFilter, 0, PAGE).then((rows) => withNazoStats("creators", rows)),
      findNamed("tag", nameFilter, 0, PAGE).then((rows) => withNazoStats("tags", rows)),
      Nazo.countDocuments(filter),
      Creator.countDocuments(nameFilter),
      Tag.countDocuments(nameFilter),
    ]);
    return NextResponse.json({
      nazos,
      creators,
      tags,
      counts: { nazo: nazoCount, creator: creatorCount, tag: tagCount },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
