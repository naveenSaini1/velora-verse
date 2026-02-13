# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Product Bundles APIs."""

import frappe


@frappe.whitelist(allow_guest=True)
def get_bundles(page=1, limit=20):
	"""Get all active product bundles."""
	page = max(1, int(page))
	limit = min(50, max(1, int(limit)))
	offset = (page - 1) * limit

	total_count = frappe.db.count("Product Bundle", {"is_active": 1})

	bundles = frappe.get_all(
		"Product Bundle",
		filters={"is_active": 1},
		fields=[
			"name", "bundle_name", "slug", "bundle_price",
			"individual_total", "savings_amount", "savings_percentage",
		],
		order_by="modified desc",
		limit_page_length=limit,
		limit_start=offset,
	)

	# Attach primary image
	for bundle in bundles:
		img = frappe.get_all(
			"Images",
			filters={"parent": bundle.name, "parenttype": "Product Bundle", "is_primary": 1},
			fields=["image", "alt_text"],
			limit=1,
		)
		bundle["primary_image"] = img[0].image if img else None
		bundle["item_count"] = frappe.db.count("Bundle Items", {"parent": bundle.name})

	return {
		"bundles": bundles,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit if total_count else 0,
	}


@frappe.whitelist(allow_guest=True)
def get_bundle_detail(slug=None, name=None):
	"""Get full details of a product bundle."""
	if not slug and not name:
		frappe.throw("Either slug or name is required.")

	if slug:
		bundle_name = frappe.db.get_value("Product Bundle", {"slug": slug, "is_active": 1}, "name")
	else:
		bundle_name = name

	if not bundle_name or not frappe.db.exists("Product Bundle", bundle_name):
		frappe.throw("Bundle not found.", frappe.DoesNotExistError)

	bundle = frappe.get_doc("Product Bundle", bundle_name)

	items = []
	for row in bundle.bundle_items or []:
		variant_data = frappe.db.get_value(
			"Variants", row.variant, ["title", "price", "is_stock", "variant_name"], as_dict=True
		) if row.variant else {}
		items.append({
			"variant": row.variant,
			"variant_title": row.variant_title or (variant_data.get("title") if variant_data else ""),
			"bundle_quantity": row.bundle_quantity,
			"individual_price": row.individual_price,
			"in_stock": variant_data.get("is_stock", 0) if variant_data else 0,
			"item_name": variant_data.get("variant_name") if variant_data else None,
		})

	images = []
	for row in bundle.images or []:
		images.append({
			"image": row.image,
			"alt_text": row.alt_text,
			"is_primary": row.is_primary,
			"display_order": row.display_order,
		})

	return {
		"name": bundle.name,
		"bundle_name": bundle.bundle_name,
		"slug": bundle.slug,
		"bundle_price": bundle.bundle_price,
		"individual_total": bundle.individual_total,
		"savings_amount": bundle.savings_amount,
		"savings_percentage": bundle.savings_percentage,
		"items": items,
		"images": images,
	}


@frappe.whitelist()
def add_bundle_to_cart(bundle):
	"""Add all items from a bundle to the user's cart."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to add items to cart.")

	if not frappe.db.exists("Product Bundle", bundle):
		frappe.throw("Bundle not found.")

	bundle_doc = frappe.get_doc("Product Bundle", bundle)
	if not bundle_doc.is_active:
		frappe.throw("This bundle is no longer available.")

	from velora_verse.velora_verse.doctype.cart.cart import _get_or_create_cart

	cart = _get_or_create_cart(user)

	for row in bundle_doc.bundle_items or []:
		if not row.variant:
			continue

		# Check stock
		is_stock = frappe.db.get_value("Variants", row.variant, "is_stock")
		if not is_stock:
			frappe.throw(f"'{row.variant_title or row.variant}' is out of stock.")

		# Check if variant already in cart
		existing = None
		for cart_row in cart.cart_items or []:
			if cart_row.variant == row.variant:
				existing = cart_row
				break

		if existing:
			existing.quantity += row.bundle_quantity or 1
			existing.is_bundle_item = 1
			existing.bundle_reference = bundle
		else:
			cart.append("cart_items", {
				"variant": row.variant,
				"quantity": row.bundle_quantity or 1,
				"is_bundle_item": 1,
				"bundle_reference": bundle,
			})

	cart.save(ignore_permissions=True)

	return {
		"message": "Bundle added to cart",
		"cart": cart.name,
		"total": cart.total,
	}
