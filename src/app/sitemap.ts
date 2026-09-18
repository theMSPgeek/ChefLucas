import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cheflucas.fk-it.co.uk";
  const routes = [
    "",
    "/services",
    "/menus",
    "/events",
    "/book",
    "/shop",
    "/about",
    "/contact",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
