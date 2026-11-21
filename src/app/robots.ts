import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    // The debug and specimen pages are build tools, not part of the site.
    rules: { userAgent: "*", allow: "/", disallow: ["/debug/", "/specimen"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
