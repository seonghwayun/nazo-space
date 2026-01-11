import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/my/", "/admin/"],
    },
    sitemap: "https://nazo.respace.cc/sitemap.xml",
  };
}
