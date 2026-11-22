import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/services", "/pricing", "/reviews", "/contact", "/payment", "/privacy", "/terms", "/cancellation"];
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
