import { MetadataRoute } from "next";
import { getAllCachedForums } from "@/lib/cache/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nga-mirror.example.com";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/favorites`, lastModified: now, changeFrequency: "weekly", priority: 0.3 },
  ];

  try {
    const forums = getAllCachedForums();
    for (const f of forums) {
      routes.push({
        url: `${baseUrl}/forum/${f.fid}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.8,
      });
    }
  } catch {
    // If DB is not initialized yet, skip forum URLs
  }

  return routes;
}
