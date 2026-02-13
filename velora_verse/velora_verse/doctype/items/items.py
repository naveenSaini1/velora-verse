# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import re

import frappe
from frappe.model.document import Document


class Items(Document):
	def validate(self):
		self.validate_base_price()
		self.validate_sku_format()
		self.validate_primary_image()
		self.validate_duplicate_categories()
		self.generate_slug()

	def on_trash(self):
		self.validate_no_variants()

	def validate_base_price(self):
		if self.base_price is not None and self.base_price <= 0:
			frappe.throw("Base Price must be greater than 0.")

	def validate_sku_format(self):
		if self.sku and not re.match(r"^[A-Za-z0-9\-_]+$", self.sku):
			frappe.throw("SKU can only contain letters, numbers, hyphens, and underscores.")

	def validate_primary_image(self):
		if not self.item_image:
			return

		primary_count = sum(1 for row in self.item_image if row.is_primary)

		# If multiple primaries, keep only the first one
		if primary_count > 1:
			found_first = False
			for row in self.item_image:
				if row.is_primary:
					if not found_first:
						found_first = True
					else:
						row.is_primary = 0

	def validate_duplicate_categories(self):
		if not self.category:
			return

		seen = set()
		for row in self.category:
			if row.category in seen:
				frappe.throw(f"Duplicate category '{row.category}' in the category list.")
			seen.add(row.category)

	def validate_no_variants(self):
		variants = frappe.db.count("Variants", {"variant_name": self.name})
		if variants:
			frappe.throw(
				f"Cannot delete '{self.item_name}': it has {variants} variant(s). Delete them first."
			)

	def generate_slug(self):
		if not self.slug and self.item_name:
			slug = _slugify(self.item_name)
			# Ensure uniqueness
			existing = frappe.db.get_value("Items", {"slug": slug, "name": ["!=", self.name]})
			if existing:
				slug = f"{slug}-{self.name.lower()}"
			self.slug = slug


def _slugify(text):
	"""Convert text to URL-friendly slug."""
	import re

	text = text.lower().strip()
	text = re.sub(r"[^\w\s-]", "", text)
	text = re.sub(r"[-\s]+", "-", text)
	return text.strip("-")


@frappe.whitelist()
def get_leaf_categories(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql("""
		SELECT name, category_name FROM `tabCategory`
		WHERE name NOT IN (
			SELECT DISTINCT parent_category
			FROM `tabCategory`
			WHERE parent_category IS NOT NULL AND parent_category != ''
		)
		AND name LIKE %s
		ORDER BY name ASC
		LIMIT %s, %s
	""", ("%" + txt + "%", start, page_len))
