# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Items(Document):
	def validate(self):
		self.validate_primary_image()
		self.validate_duplicate_categories()

	def on_trash(self):
		self.validate_no_variants()

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
