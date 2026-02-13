# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Flash Sales / Promotions APIs and helpers."""

import frappe
from frappe.utils import now_datetime


@frappe.whitelist(allow_guest=True)
def get_active_promotions():
	"""Get all currently active promotions."""
	now = now_datetime()

	promotions = frappe.get_all(
		"Promotion",
		filters={
			"is_active": 1,
			"start_datetime": ["<=", now],
			"end_datetime": [">=", now],
		},
		fields=[
			"name", "promotion_title", "discount_type", "discount_value",
			"start_datetime", "end_datetime", "badge_text", "banner_image",
			"apply_to", "priority_level",
		],
		order_by="priority_level desc, start_datetime asc",
	)

	for promo in promotions:
		# Count applicable items
		if promo.apply_to == "Specific Items":
			promo["item_count"] = frappe.db.count(
				"Promotion Items", {"parent": promo.name}
			)
		elif promo.apply_to == "All Items":
			promo["item_count"] = frappe.db.count("Items", {"status": "Active"})

	return {"promotions": promotions}


@frappe.whitelist(allow_guest=True)
def get_flash_sale_products(promotion, page=1, limit=20):
	"""Get products in a specific promotion/flash sale."""
	page = max(1, int(page))
	limit = min(50, max(1, int(limit)))
	offset = (page - 1) * limit

	if not frappe.db.exists("Promotion", promotion):
		frappe.throw("Promotion not found.")

	promo = frappe.get_doc("Promotion", promotion)

	now = now_datetime()
	if not promo.is_active or promo.start_datetime > now or promo.end_datetime < now:
		return {"products": [], "total_count": 0, "promotion": None}

	if promo.apply_to == "All Items":
		products = frappe.db.sql("""
			SELECT i.name, i.item_name, i.slug, i.base_price, i.average_rating,
				i.review_count, i.in_stock
			FROM `tabItems` i
			WHERE i.status = 'Active'
			ORDER BY i.modified DESC
			LIMIT %(limit)s OFFSET %(offset)s
		""", {"limit": limit, "offset": offset}, as_dict=True)
		total_count = frappe.db.count("Items", {"status": "Active"})

	elif promo.apply_to == "Category":
		# Get categories from promotion_items
		cat_names = frappe.get_all(
			"Promotion Items",
			filters={"parent": promotion, "reference_doctype": "Category"},
			pluck="reference_name",
		)
		if not cat_names:
			return {"products": [], "total_count": 0}

		products = frappe.db.sql("""
			SELECT DISTINCT i.name, i.item_name, i.slug, i.base_price,
				i.average_rating, i.review_count, i.in_stock
			FROM `tabItems` i
			INNER JOIN `tabItem Category` ic ON ic.parent = i.name
			WHERE i.status = 'Active' AND ic.category IN %(categories)s
			ORDER BY i.modified DESC
			LIMIT %(limit)s OFFSET %(offset)s
		""", {"categories": cat_names, "limit": limit, "offset": offset}, as_dict=True)

		total_count = frappe.db.sql("""
			SELECT COUNT(DISTINCT i.name)
			FROM `tabItems` i
			INNER JOIN `tabItem Category` ic ON ic.parent = i.name
			WHERE i.status = 'Active' AND ic.category IN %(categories)s
		""", {"categories": cat_names})[0][0]

	else:
		# Specific Items
		item_names = frappe.get_all(
			"Promotion Items",
			filters={"parent": promotion, "reference_doctype": "Items"},
			pluck="reference_name",
		)
		variant_names = frappe.get_all(
			"Promotion Items",
			filters={"parent": promotion, "reference_doctype": "Variants"},
			pluck="reference_name",
		)

		# Get parent items for variant references
		if variant_names:
			parent_items = frappe.get_all(
				"Variants",
				filters={"name": ["in", variant_names]},
				pluck="variant_name",
			)
			item_names = list(set(item_names + parent_items))

		if not item_names:
			return {"products": [], "total_count": 0}

		products = frappe.get_all(
			"Items",
			filters={"name": ["in", item_names], "status": "Active"},
			fields=["name", "item_name", "slug", "base_price", "average_rating", "review_count", "in_stock"],
			order_by="modified desc",
			limit_page_length=limit,
			limit_start=offset,
		)
		total_count = frappe.db.count("Items", {"name": ["in", item_names], "status": "Active"})

	# Attach sale prices and primary images
	for p in products:
		effective = get_effective_price_for_item(p.name)
		p["sale_price"] = effective["sale_price"]
		p["discount_badge"] = effective.get("badge_text")
		p["promotion_name"] = effective.get("promotion_name")

	if products:
		from velora_verse.api.products import _attach_primary_images
		_attach_primary_images(products, [p.name for p in products])

	return {
		"products": products,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit if total_count else 0,
		"promotion": {
			"name": promo.name,
			"title": promo.promotion_title,
			"badge_text": promo.badge_text,
			"end_datetime": promo.end_datetime,
		},
	}


def get_effective_price(variant_name):
	"""
	Get the effective price for a variant after applying promotions.
	Returns the best (lowest) promotional price.

	Args:
		variant_name: Variants document name

	Returns:
		dict with original_price, sale_price, promotion_name, badge_text
	"""
	variant = frappe.db.get_value(
		"Variants", variant_name, ["price", "variant_name"], as_dict=True
	)
	if not variant:
		return {"original_price": 0, "sale_price": None}

	original_price = variant.price or 0
	item_name = variant.variant_name

	result = _find_best_promotion(item_name, variant_name, original_price)

	return {
		"original_price": original_price,
		"sale_price": result.get("sale_price"),
		"promotion_name": result.get("promotion_name"),
		"badge_text": result.get("badge_text"),
	}


def get_effective_price_for_item(item_name):
	"""Get effective (sale) price for an item based on base_price."""
	base_price = frappe.db.get_value("Items", item_name, "base_price") or 0
	result = _find_best_promotion(item_name, None, base_price)
	return {
		"original_price": base_price,
		"sale_price": result.get("sale_price"),
		"promotion_name": result.get("promotion_name"),
		"badge_text": result.get("badge_text"),
	}


def _find_best_promotion(item_name, variant_name, original_price):
	"""Find the best active promotion for an item/variant."""
	now = now_datetime()

	active_promos = frappe.get_all(
		"Promotion",
		filters={
			"is_active": 1,
			"start_datetime": ["<=", now],
			"end_datetime": [">=", now],
		},
		fields=["name", "promotion_title", "discount_type", "discount_value",
			"apply_to", "badge_text", "priority_level"],
		order_by="priority_level desc",
	)

	if not active_promos:
		return {}

	best_price = original_price
	best_promo = None

	for promo in active_promos:
		applies = False

		if promo.apply_to == "All Items":
			applies = True
		elif promo.apply_to == "Category":
			# Check if item is in a promoted category
			item_cats = frappe.get_all("Item Category", filters={"parent": item_name}, pluck="category")
			promo_cats = frappe.get_all(
				"Promotion Items",
				filters={"parent": promo.name, "reference_doctype": "Category"},
				pluck="reference_name",
			)
			applies = bool(set(item_cats) & set(promo_cats))
		else:
			# Specific Items — check if item or variant is listed
			promo_items = frappe.get_all(
				"Promotion Items",
				filters={"parent": promo.name},
				fields=["reference_doctype", "reference_name"],
			)
			for pi in promo_items:
				if pi.reference_doctype == "Items" and pi.reference_name == item_name:
					applies = True
					break
				if pi.reference_doctype == "Variants" and pi.reference_name == variant_name:
					applies = True
					break

		if not applies:
			continue

		# Calculate promotional price
		sale_price = _calculate_promo_price(original_price, promo)
		if sale_price < best_price:
			best_price = sale_price
			best_promo = promo

	if best_promo:
		return {
			"sale_price": round(best_price, 2),
			"promotion_name": best_promo.name,
			"badge_text": best_promo.badge_text,
		}

	return {}


def _calculate_promo_price(original_price, promo):
	"""Calculate price after applying a promotion."""
	if promo.discount_type == "Percentage":
		return original_price * (1 - promo.discount_value / 100)
	elif promo.discount_type == "Flat":
		return max(0, original_price - promo.discount_value)
	elif promo.discount_type == "Fixed Price":
		return promo.discount_value
	return original_price


def activate_deactivate_promotions():
	"""Cron job: auto-toggle promotions based on start/end datetime."""
	now = now_datetime()

	# Activate promotions that should be active
	frappe.db.sql("""
		UPDATE `tabPromotion`
		SET is_active = 1
		WHERE is_active = 0
		AND start_datetime <= %s AND end_datetime >= %s
	""", (now, now))

	# Deactivate expired promotions
	frappe.db.sql("""
		UPDATE `tabPromotion`
		SET is_active = 0
		WHERE is_active = 1
		AND end_datetime < %s
	""", now)

	frappe.db.commit()
