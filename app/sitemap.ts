import { MetadataRoute } from "next";
import connectToDatabase from "@/lib/db";
import Nazo from "@/models/nazo";
import Creator from "@/models/creator";
import Tag from "@/models/tag";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      changeFrequency: "daily" as const,
      priority: 1.0,
    }));

    // 2. Dynamic Nazos
    // Limit to recent 1000 or similar if needed, but for now getting all IDs is usually fine for small-medium sites.
    const nazos = await Nazo.find().select("_id updatedAt").sort({ createdAt: -1 }).lean();
    const nazoRoutes = nazos.map((nazo) => ({
      url: `${baseUrl}/nazo/${nazo._id}`,
      lastModified: nazo.updatedAt ? new Date(nazo.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // 3. Dynamic Creators
    const creators = await Creator.find().select("_id").lean();
    const creatorRoutes = creators.map((creator) => ({
      url: `${baseUrl}/creator/${creator._id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // 4. Dynamic Tags
    const tags = await Tag.find().select("_id").lean();
    const tagRoutes = tags.map((tag) => ({
      url: `${baseUrl}/tag/${tag._id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...nazoRoutes, ...creatorRoutes, ...tagRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Return static routes as fallback
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }
}
