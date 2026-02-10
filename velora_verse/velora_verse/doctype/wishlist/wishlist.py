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


@frappe.whitelist()
def add_to_wishlist(variant):
	"""Add a variant to the current user's wishlist. Creates the wishlist if it doesn't exist."""
	if not variant or not frappe.db.exists("Variants", variant):
		frappe.throw("Invalid variant.")

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


@frappe.whitelist()
def is_in_wishlist(variant):
	"""Check if a variant is in the current user's wishlist."""
	user = frappe.session.user
	wishlist_name = frappe.db.get_value("Wishlist", {"user": user})

	if not wishlist_name:
		return {"in_wishlist": False}

	exists = frappe.db.exists("Wishlist Items", {
		"parent": wishlist_name,
		"variant": variant,
	})

	return {"in_wishlist": bool(exists)}
