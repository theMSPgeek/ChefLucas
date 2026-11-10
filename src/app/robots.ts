import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/shop/operator" },
    sitemap: "https://cheflucas.fk-it.co.uk/sitemap.xml",
  };
}
