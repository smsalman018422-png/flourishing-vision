import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://letusgrow.com";
const PATHS = ["/"];

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const now = new Date().toISOString();
        const urls = PATHS.map(
          (p) => `<url><loc>${SITE}${p}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.7"}</priority></url>`
        ).join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
