import { getFrappeUrl } from "@/lib/api/client";

export async function GET() {
  const frappeUrl = getFrappeUrl();

  try {
    const res = await fetch(
      `${frappeUrl}/api/method/velora_verse.api.sitemap.get_sitemap`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const entries = data.message || [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${entries
  .map(
    (entry: { url: string; lastmod?: string; changefreq?: string; priority?: number; images?: Array<{ loc: string }> }) => `  <url>
    <loc>${baseUrl}${entry.url}</loc>${
      entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
    }
    <changefreq>${entry.changefreq || "weekly"}</changefreq>
    <priority>${entry.priority || 0.7}</priority>${
      entry.images
        ? entry.images
            .map(
              (img: { loc: string }) =>
                `\n    <image:image>\n      <image:loc>${frappeUrl}${img.loc}</image:loc>\n    </image:image>`
            )
            .join("")
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    // Return minimal sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc></url>
  <url><loc>${baseUrl}/products</loc></url>
  <url><loc>${baseUrl}/categories</loc></url>
</urlset>`;
    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
