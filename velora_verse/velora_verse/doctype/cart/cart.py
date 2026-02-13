# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Cart(Document):
	def before_save(self):
		if not self.user:
			self.user = frappe.session.user

		self.validate_duplicate_variants()
		self.validate_quantities()
		self.calculate_totals()

	def validate_duplicate_variants(self):
		if not self.cart_items:
			return

		seen = set()
		for row in self.cart_items:
			if row.variant in seen:
				frappe.throw(f"Variant '{row.variant}' is already in your cart. Update quantity instead.")
			seen.add(row.variant)

	def validate_quantities(self):
		for row in self.cart_items or []:
			if not row.quantity or row.quantity < 1:
				frappe.throw(f"Quantity for '{row.variant}' must be at least 1.")

	def calculate_totals(self):
		self.total = 0
		for row in self.cart_items or []:
			if not row.rate and row.variant:
				row.rate = frappe.db.get_value("Variants", row.variant, "price") or 0
			row.amount = (row.rate or 0) * (row.quantity or 0)
			self.total += row.amount


def _get_or_create_cart(user):
	"""Get existing cart or create a new one for the user. Handles race conditions."""
	cart_name = frappe.db.get_value("Cart", {"user": user})
	if cart_name:
		return frappe.get_doc("Cart", cart_name)

	cart = frappe.new_doc("Cart")
	cart.user = user
	try:
		cart.save(ignore_permissions=True)
	except frappe.DuplicateEntryError:
		# Race condition: another request created the cart first
		frappe.clear_last_message()
		cart_name = frappe.db.get_value("Cart", {"user": user})
		return frappe.get_doc("Cart", cart_name)
	return cart


def _resolve_cart_variant(variant):
	"""Resolve a variant or item name to a valid Variants document name."""
	if not variant:
		frappe.throw("Invalid variant.")

	if frappe.db.exists("Variants", variant):
		return variant

	# If it's an Item, find its first variant or create a default one
	if frappe.db.exists("Items", variant):
		first_variant = frappe.db.get_value("Variants", {"variant_name": variant}, "name")
		if first_variant:
			return first_variant

		# Auto-create a default variant for non-variant products
		item = frappe.get_doc("Items", variant)
		if not item.has_variants:
			default_variant = frappe.get_doc({
				"doctype": "Variants",
				"variant_name": variant,
				"title": item.item_name,
				"price": item.base_price or 0,
				"is_stock": item.in_stock,
				"quantity": 99,
				"slug": item.slug,
			})
			default_variant.insert(ignore_permissions=True)
			frappe.db.commit()
			return default_variant.name

		frappe.throw("Please select a variant before adding to cart.")

	frappe.throw("Invalid product.")


@frappe.whitelist()
def add_to_cart(variant, quantity=1):
	"""Add a variant to the current user's cart."""
	variant = _resolve_cart_variant(variant)

	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to add items to cart.")

	quantity = int(quantity)
	if quantity < 1:
		frappe.throw("Quantity must be at least 1.")

	cart = _get_or_create_cart(user)

	# If variant already in cart, use atomic SQL to increment quantity
	existing_row = frappe.db.get_value(
		"Cart Items", {"parent": cart.name, "variant": variant}, "name"
	)
	if existing_row:
		frappe.db.sql("""
			UPDATE `tabCart Items`
			SET quantity = quantity + %(qty)s
			WHERE name = %(row)s
		""", {"qty": quantity, "row": existing_row})
		cart.reload()
		cart.calculate_totals()
		cart.save(ignore_permissions=True)
		return {"message": "Quantity updated", "cart": cart.name, "total": cart.total}

	cart.append("cart_items", {"variant": variant, "quantity": quantity})
	cart.save(ignore_permissions=True)

	return {"message": "Added to cart", "cart": cart.name, "total": cart.total}


@frappe.whitelist()
def update_cart_quantity(variant, quantity):
	"""Update quantity of a variant in the cart."""
	user = frappe.session.user
	cart_name = frappe.db.get_value("Cart", {"user": user})

	if not cart_name:
		frappe.throw("Your cart is empty.")

	quantity = int(quantity)
	cart = frappe.get_doc("Cart", cart_name)

	for row in cart.cart_items or []:
		if row.variant == variant:
			if quantity < 1:
				cart.remove(row)
			else:
				row.quantity = quantity
			cart.save(ignore_permissions=True)
			return {"message": "Cart updated", "total": cart.total}

	frappe.throw("This variant is not in your cart.")


@frappe.whitelist()
def remove_from_cart(variant):
	"""Remove a variant from the cart."""
	return update_cart_quantity(variant, 0)


@frappe.whitelist()
def clear_cart():
	"""Clear all items from the current user's cart."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	cart_name = frappe.db.get_value("Cart", {"user": user})
	if not cart_name:
		return {"message": "Cart is already empty", "total": 0}

	cart = frappe.get_doc("Cart", cart_name)
	for row in list(cart.cart_items):
		cart.remove(row)
	cart.save(ignore_permissions=True)

	return {"message": "Cart cleared", "total": 0}


@frappe.whitelist()
def get_cart():
	"""Get the current user's cart with enriched item data."""
	user = frappe.session.user
	cart_name = frappe.db.get_value("Cart", {"user": user})

	if not cart_name:
		return {"items": [], "total": 0, "subtotal": 0, "item_count": 0}

	cart = frappe.get_doc("Cart", cart_name)
	items = []
	item_count = 0

	# Batch-fetch variant info to avoid N+1 queries
	variant_names = [row.variant for row in cart.cart_items or [] if row.variant]
	variant_data = {}
	if variant_names:
		rows = frappe.db.sql("""
			SELECT v.name, v.variant_name, v.title, v.quantity as stock_qty,
				i.item_name, i.slug
			FROM `tabVariants` v
			LEFT JOIN `tabItems` i ON v.variant_name = i.name
			WHERE v.name IN %(names)s
		""", {"names": variant_names}, as_dict=True)
		for r in rows:
			variant_data[r.name] = r

		# Fetch first image for each variant (from Variants images child table)
		img_rows = frappe.db.sql("""
			SELECT parent, image
			FROM `tabImages`
			WHERE parenttype = 'Variants' AND parent IN %(names)s
			ORDER BY idx ASC
		""", {"names": variant_names}, as_dict=True)
		variant_images = {}
		for ir in img_rows:
			if ir.parent not in variant_images:
				variant_images[ir.parent] = ir.image

		# Fallback: fetch item images for variants that don't have their own
		missing = [v for v in variant_names if v not in variant_images]
		item_names_for_img = list({variant_data[v].variant_name for v in missing if v in variant_data and variant_data[v].variant_name})
		item_images = {}
		if item_names_for_img:
			item_img_rows = frappe.db.sql("""
				SELECT parent, image
				FROM `tabImages`
				WHERE parenttype = 'Items' AND parent IN %(names)s
				ORDER BY idx ASC
			""", {"names": item_names_for_img}, as_dict=True)
			for ir in item_img_rows:
				if ir.parent not in item_images:
					item_images[ir.parent] = ir.image

	for row in cart.cart_items or []:
		vd = variant_data.get(row.variant, {})
		item_name_val = vd.get("item_name") or row.variant_title or ""
		# Get image: variant image > item image > None
		image = None
		if row.variant in variant_images:
			image = variant_images[row.variant]
		elif vd.get("variant_name") and vd["variant_name"] in item_images:
			image = item_images[vd["variant_name"]]

		items.append({
			"name": row.name,
			"variant": row.variant,
			"variant_title": row.variant_title,
			"item_name": item_name_val,
			"image": image,
			"slug": vd.get("slug") or "",
			"quantity": row.quantity,
			"rate": row.rate,
			"amount": row.amount,
			"max_qty": vd.get("stock_qty") or 99,
			"is_bundle_item": row.is_bundle_item or 0,
			"bundle_reference": row.bundle_reference or "",
		})
		item_count += (row.quantity or 0)

	return {
		"items": items,
		"subtotal": cart.total,
		"total": cart.total,
		"item_count": item_count,
	}


@frappe.whitelist()
def move_wishlist_to_cart(variant):
	"""Move a variant from wishlist to cart."""
	from velora_verse.velora_verse.doctype.wishlist.wishlist import remove_from_wishlist

	add_to_cart(variant, 1)
	try:
		remove_from_wishlist(variant)
	except Exception:
		pass  # Not in wishlist, that's fine

	return {"message": "Moved to cart"}
