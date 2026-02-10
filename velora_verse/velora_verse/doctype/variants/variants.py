# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Variants(Document):
	def autoname(self):
		self.title = self._build_title()
		self.name = self.title

	def before_save(self):
		self.title = self._build_title()
		self.validate_has_variant_values()
		self.validate_price()
		self.set_default_price()
		self.validate_duplicate_variant()
		self.validate_primary_image()

	def on_update(self):
		self.update_parent_stock_status()

	def on_trash(self):
		self.update_parent_stock_status()

	def validate_has_variant_values(self):
		if self.variant_name and not self.variant_values:
			frappe.throw("At least one variant value is required.")

	def validate_price(self):
		if self.price and self.price < 0:
			frappe.throw("Price cannot be negative.")

	def _build_title(self):
		base_name = ""
		if self.variant_name:
			base_name = frappe.db.get_value("Items", self.variant_name, "item_name") or ""

		variant_parts = [row.value for row in self.variant_values if row.value]

		if base_name and variant_parts:
			return base_name + " - " + " - ".join(variant_parts)
		return base_name or self.name or ""

	def set_default_price(self):
		if (not self.price or self.price <= 0) and self.variant_name:
			base_price = frappe.get_value("Items", self.variant_name, "base_price")
			if base_price:
				self.price = base_price

	def validate_duplicate_variant(self):
		if not self.variant_name:
			return

		current_values = {}
		for row in self.variant_values:
			if row.type and row.value:
				current_values[row.type] = row.value

		if not current_values:
			return

		# Get all other variant names for this item in a single query
		other_variants = frappe.get_all(
			"Variants",
			filters={"variant_name": self.variant_name, "name": ["!=", self.name]},
			pluck="name",
		)

		if not other_variants:
			return

		# Fetch all variant table rows for these variants in one bulk query (fixes N+1)
		all_rows = frappe.get_all(
			"Variant Table",
			filters={"parent": ["in", other_variants]},
			fields=["parent", "type", "value"],
		)

		# Group by parent variant
		other_map = {}
		for row in all_rows:
			other_map.setdefault(row.parent, {})[row.type] = row.value

		for variant_name, other_values in other_map.items():
			if current_values == other_values:
				frappe.throw(
					f"A Variant with the same combination of values already exists: {variant_name}"
				)

	def validate_primary_image(self):
		if not self.image:
			return

		primary_count = sum(1 for row in self.image if row.is_primary)

		# If multiple primaries, keep only the first one
		if primary_count > 1:
			found_first = False
			for row in self.image:
				if row.is_primary:
					if not found_first:
						found_first = True
					else:
						row.is_primary = 0

	def update_parent_stock_status(self):
		if not self.variant_name:
			return

		has_stock = frappe.db.count("Variants", {
			"variant_name": self.variant_name,
			"is_stock": 1,
		}) > 0

		frappe.db.set_value("Items", self.variant_name, "in_stock", 1 if has_stock else 0)


@frappe.whitelist()
def get_variant_values(doctype, txt, searchfield, start, page_len, filters):
	if not filters.get("variant_type"):
		return []

	variant_type = filters.get("variant_type")

	parent_doc = frappe.db.get_value(
		"Variant Type Property", {"variant_type": variant_type}, "name"
	)

	if not parent_doc:
		return []

	return frappe.db.sql("""
		SELECT name, `values`
		FROM `tabVariant Properties`
		WHERE parent = %s
		AND `values` LIKE %s
		ORDER BY `values` ASC
		LIMIT %s, %s
	""", (parent_doc, "%" + txt + "%", start, page_len))
