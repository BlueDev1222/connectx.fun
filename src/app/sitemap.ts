import type { MetadataRoute } from "next";
import { pages } from "@/lib/pages";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [
    "",
    "explore",
    "communities",
    "servers",
    ...Object.keys(pages).filter(
      (p) =>
        ![
          "403",
          "500",
          "suspended",
          "suspended-community",
          "maintenance",
        ].includes(p),
    ),
  ].map((path) => ({ url: base + "/" + path, changeFrequency: "weekly" }));
}
