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
	"""Get existing cart or create a new one for the user."""
	cart_name = frappe.db.get_value("Cart", {"user": user})
	if cart_name:
		return frappe.get_doc("Cart", cart_name)

	cart = frappe.new_doc("Cart")
	cart.user = user
	return cart


@frappe.whitelist()
def add_to_cart(variant, quantity=1):
	"""Add a variant to the current user's cart."""
	if not variant or not frappe.db.exists("Variants", variant):
		frappe.throw("Invalid variant.")

	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to add items to cart.")

	quantity = int(quantity)
	if quantity < 1:
		frappe.throw("Quantity must be at least 1.")

	cart = _get_or_create_cart(user)

	# If variant already in cart, increase quantity
	for row in cart.cart_items or []:
		if row.variant == variant:
			row.quantity += quantity
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
def get_cart():
	"""Get the current user's cart."""
	user = frappe.session.user
	cart_name = frappe.db.get_value("Cart", {"user": user})

	if not cart_name:
		return {"items": [], "total": 0}

	cart = frappe.get_doc("Cart", cart_name)
	items = []
	for row in cart.cart_items or []:
		items.append({
			"variant": row.variant,
			"variant_title": row.variant_title,
			"quantity": row.quantity,
			"rate": row.rate,
			"amount": row.amount,
		})

	return {"items": items, "total": cart.total}


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
