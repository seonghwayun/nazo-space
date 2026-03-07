import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";

export const revalidate = 86400; // 24시간마다 갱신 (캐싱)

export async function GET() {
  const baseUrl = "https://nazo.respace.cc";

  try {
    await connectToDatabase();

    // 1. Static Routes
    const staticRoutes = [
      "",
      "/search",
      "/reference",
      "/reference/kana",
      "/reference/keyboard",
      "/reference/prefectures",
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    }));

    // 2. Dynamic Nazos
    const nazos = await Nazo.find().select("_id updatedAt").sort({ createdAt: -1 }).lean();
    const nazoRoutes = nazos.map((nazo) => ({
      url: `${baseUrl}/nazo/${nazo._id}`,
      lastModified: nazo.updatedAt ? new Date(nazo.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 3. Dynamic Creators
    const creators = await Creator.find().select("_id").lean();
    const creatorRoutes = creators.map((creator) => ({
      url: `${baseUrl}/creator/${creator._id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    // 4. Dynamic Tags
    const tags = await Tag.find().select("_id").lean();
    const tagRoutes = tags.map((tag) => ({
      url: `${baseUrl}/tag/${tag._id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    const allRoutes = [...staticRoutes, ...nazoRoutes, ...creatorRoutes, ...tagRoutes];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
        .map(
          (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified.toISOString()}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
        )
        .join("\n")}
</urlset>`;

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Sitemap XML generation error:", error);

    // Fallback: Return basic valid XML if DB fails
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      status: 200, // Return 200 even on DB error so GSC doesn't choke on a 500 error page
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate",
      },
    });
  }
}
