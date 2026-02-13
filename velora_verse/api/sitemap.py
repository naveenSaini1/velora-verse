# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""SEO Sitemap generation APIs."""

import frappe
from frappe.utils import now_datetime


@frappe.whitelist(allow_guest=True)
def get_sitemap():
	"""Generate XML sitemap with all published product and category URLs."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	base_url = (getattr(settings, "site_base_url", "") or frappe.utils.get_url()).rstrip("/")
	change_freq = getattr(settings, "sitemap_change_frequency", "weekly") or "weekly"
	include_images = getattr(settings, "sitemap_include_images", 0)

	urls = []

	# Product pages
	products = frappe.get_all(
		"Items",
		filters={"status": "Active"},
		fields=["slug", "modified"],
		order_by="modified desc",
	)

	for p in products:
		entry = {
			"loc": f"{base_url}/product/{p.slug}",
			"lastmod": str(p.modified.date()) if p.modified else str(now_datetime().date()),
			"changefreq": change_freq,
			"priority": "0.8",
		}
		if include_images:
			images = frappe.get_all(
				"Images",
				filters={"parent": p.slug, "parenttype": "Items", "is_primary": 1},
				fields=["image", "alt_text"],
				limit=1,
			)
			if images:
				entry["image"] = f"{base_url}{images[0].image}"
				entry["image_title"] = images[0].alt_text or ""
		urls.append(entry)

	# Category pages
	categories = frappe.get_all(
		"Category",
		filters={"is_active": 1},
		fields=["slug", "modified"],
		order_by="display_order asc",
	)

	for c in categories:
		urls.append({
			"loc": f"{base_url}/category/{c.slug}",
			"lastmod": str(c.modified.date()) if c.modified else str(now_datetime().date()),
			"changefreq": change_freq,
			"priority": "0.6",
		})

	# Build XML
	xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
	if include_images:
		xml_parts.append(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
			'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
		)
	else:
		xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

	for url in urls:
		xml_parts.append("  <url>")
		xml_parts.append(f"    <loc>{_escape_xml(url['loc'])}</loc>")
		xml_parts.append(f"    <lastmod>{url['lastmod']}</lastmod>")
		xml_parts.append(f"    <changefreq>{url['changefreq']}</changefreq>")
		xml_parts.append(f"    <priority>{url['priority']}</priority>")
		if "image" in url:
			xml_parts.append("    <image:image>")
			xml_parts.append(f"      <image:loc>{_escape_xml(url['image'])}</image:loc>")
			if url.get("image_title"):
				xml_parts.append(f"      <image:title>{_escape_xml(url['image_title'])}</image:title>")
			xml_parts.append("    </image:image>")
		xml_parts.append("  </url>")

	xml_parts.append("</urlset>")

	return {"xml": "\n".join(xml_parts), "url_count": len(urls)}


@frappe.whitelist(allow_guest=True)
def get_sitemap_index():
	"""Generate sitemap index for large sites."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	base_url = (getattr(settings, "site_base_url", "") or frappe.utils.get_url()).rstrip("/")

	xml_parts = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		"  <sitemap>",
		f"    <loc>{base_url}/api/method/velora_verse.api.sitemap.get_sitemap</loc>",
		f"    <lastmod>{str(now_datetime().date())}</lastmod>",
		"  </sitemap>",
		"</sitemapindex>",
	]

	return {"xml": "\n".join(xml_parts)}


@frappe.whitelist(allow_guest=True)
def get_robots_txt():
	"""Generate robots.txt content."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	base_url = (getattr(settings, "site_base_url", "") or frappe.utils.get_url()).rstrip("/")

	lines = [
		"User-agent: *",
		"Allow: /",
		"",
		"# Disallow admin areas",
		"Disallow: /api/",
		"Disallow: /app/",
		"Disallow: /backups/",
		"Disallow: /private/",
		"",
		f"Sitemap: {base_url}/api/method/velora_verse.api.sitemap.get_sitemap",
	]

	return {"robots_txt": "\n".join(lines)}


def _escape_xml(text):
	"""Escape XML special characters."""
	if not text:
		return ""
	return (
		str(text)
		.replace("&", "&amp;")
		.replace("<", "&lt;")
		.replace(">", "&gt;")
		.replace('"', "&quot;")
		.replace("'", "&apos;")
	)
