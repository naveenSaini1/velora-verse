export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /profile
Disallow: /addresses
Disallow: /orders
Disallow: /wishlist
Disallow: /returns
Disallow: /loyalty
Disallow: /notifications
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /register

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
