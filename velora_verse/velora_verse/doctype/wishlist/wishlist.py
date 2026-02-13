# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class Wishlist(Document):
	def before_save(self):
		if not self.user:
			self.user = frappe.session.user

		self.validate_duplicate_variants()
		self.set_added_on_for_new_rows()
		self._capture_previous_variants()

	def set_added_on_for_new_rows(self):
		for row in self.wishlist_items or []:
			if not row.added_on:
				row.added_on = now_datetime()

	def validate_duplicate_variants(self):
		if not self.wishlist_items:
			return

		seen = set()
		for row in self.wishlist_items:
			if row.variant in seen:
				frappe.throw(f"Variant '{row.variant}' is already in your wishlist.")
			seen.add(row.variant)

	def _capture_previous_variants(self):
		"""Snapshot variants before save so we can recalculate removed ones in on_update."""
		previous = self.get_doc_before_save()
		self._previous_variants = set()
		if previous:
			for row in previous.wishlist_items or []:
				if row.variant:
					self._previous_variants.add(row.variant)

	def on_update(self):
		self.update_wishlist_counts()

	def on_trash(self):
		# On trash, recalculate for all current variants
		for row in self.wishlist_items or []:
			if row.variant:
				_recalculate_wishlist_count(row.variant)

	def update_wishlist_counts(self):
		"""Recalculate wishlist_count for current + previously saved variants."""
		variants = set()

		# Current rows
		for row in self.wishlist_items or []:
			if row.variant:
				variants.add(row.variant)

		# Previously saved rows (captured before save)
		variants.update(getattr(self, "_previous_variants", set()))

		for variant in variants:
			_recalculate_wishlist_count(variant)


def _recalculate_wishlist_count(variant_name):
	"""Count how many wishlists contain this variant and update the field."""
	count = frappe.db.count("Wishlist Items", {"variant": variant_name, "parenttype": "Wishlist"})
	frappe.db.set_value("Variants", variant_name, "wishlist_count", count, update_modified=False)


def _ensure_own_wishlist(user):
	"""Verify the wishlist belongs to the current user."""
	if user != frappe.session.user and frappe.session.user != "Administrator":
		frappe.throw("You can only modify your own wishlist.", frappe.PermissionError)


def _resolve_variant(variant):
	"""Resolve a variant or item name to a valid Variants document name."""
	if not variant:
		frappe.throw("Invalid variant.")

	# If it's a Variant, return as-is
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

		frappe.throw("Please select a variant first.")

	frappe.throw("Invalid product.")


@frappe.whitelist()
def add_to_wishlist(variant):
	"""Add a variant to the current user's wishlist. Creates the wishlist if it doesn't exist."""
	variant = _resolve_variant(variant)

	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to use wishlist.")

	wishlist_name = frappe.db.get_value("Wishlist", {"user": user})

	if wishlist_name:
		wishlist = frappe.get_doc("Wishlist", wishlist_name)
		_ensure_own_wishlist(wishlist.user)
	else:
		wishlist = frappe.new_doc("Wishlist")
		wishlist.user = user

	# Check if already in wishlist
	for row in wishlist.wishlist_items or []:
		if row.variant == variant:
			frappe.throw("This variant is already in your wishlist.")

	wishlist.append("wishlist_items", {
		"variant": variant,
		"added_on": now_datetime(),
	})
	wishlist.save(ignore_permissions=True)

	return {"message": "Added to wishlist", "wishlist": wishlist.name}


@frappe.whitelist()
def remove_from_wishlist(variant):
	"""Remove a variant from the current user's wishlist."""
	variant = _resolve_variant(variant)
	user = frappe.session.user
	wishlist_name = frappe.db.get_value("Wishlist", {"user": user})

	if not wishlist_name:
		frappe.throw("You don't have a wishlist yet.")

	wishlist = frappe.get_doc("Wishlist", wishlist_name)
	_ensure_own_wishlist(wishlist.user)

	found = False
	for row in wishlist.wishlist_items or []:
		if row.variant == variant:
			wishlist.remove(row)
			found = True
			break

	if not found:
		frappe.throw("This variant is not in your wishlist.")

	wishlist.save(ignore_permissions=True)

	return {"message": "Removed from wishlist"}


@frappe.whitelist(allow_guest=True)
def is_in_wishlist(variant):
	"""Check if a variant is in the current user's wishlist."""
	user = frappe.session.user
	if user == "Guest":
		return {"in_wishlist": False}

	variant = _resolve_variant(variant)
	wishlist_name = frappe.db.get_value("Wishlist", {"user": user})

	if not wishlist_name:
		return {"in_wishlist": False}

	exists = frappe.db.exists("Wishlist Items", {
		"parent": wishlist_name,
		"variant": variant,
	})

	return {"in_wishlist": bool(exists)}


@frappe.whitelist()
def get_wishlist():
	"""Get the current user's wishlist items with details."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view wishlist.")

	wishlist_name = frappe.db.get_value("Wishlist", {"user": user})
	if not wishlist_name:
		return {"items": []}

	wishlist = frappe.get_doc("Wishlist", wishlist_name)
	items = []
	for row in wishlist.wishlist_items or []:
		item_data = {
			"variant": row.variant,
			"variant_title": row.variant_title,
			"price": row.price,
			"in_stock": row.in_stock,
			"added_on": str(row.added_on) if row.added_on else None,
			"notes": row.notes,
		}
		# Get the parent item name and image for display
		variant_data = frappe.db.get_value(
			"Variants", row.variant,
			["variant_name", "title", "slug", "price", "is_stock"],
			as_dict=True,
		)
		if variant_data:
			# Get human-readable name from Items table (not the document ID)
			actual_item_name = frappe.db.get_value("Items", variant_data.variant_name, "item_name")
			item_data["item_name"] = actual_item_name or variant_data.title or variant_data.variant_name
			item_data["slug"] = variant_data.slug or frappe.db.get_value("Items", variant_data.variant_name, "slug")
			item_data["price"] = variant_data.price
			item_data["in_stock"] = variant_data.is_stock
			# Get primary image from parent item
			image = frappe.db.get_value(
				"Images",
				{"parent": variant_data.variant_name, "parenttype": "Items", "is_primary": 1},
				"image",
			)
			if not image:
				image = frappe.db.get_value(
					"Images",
					{"parent": variant_data.variant_name, "parenttype": "Items"},
					"image",
				)
			item_data["image"] = image
		items.append(item_data)

	return {"items": items}
