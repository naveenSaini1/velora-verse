# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class VariantTypeProperty(Document):
	def validate(self):
		self.validate_has_properties()
		self.validate_unique_values()

	def on_trash(self):
		self.validate_not_used_in_variants()

	def validate_has_properties(self):
		if not self.variant_properties or len(self.variant_properties) == 0:
			frappe.throw("At least one property value is required.")

	def validate_unique_values(self):
		seen = set()
		for row in self.variant_properties:
			val = row.get("values")
			if val in seen:
				frappe.throw(f"Duplicate value '{val}' in properties. Each value must be unique.")
			seen.add(val)

	def validate_not_used_in_variants(self):
		used = frappe.db.count("Variant Table", {"type": self.variant_type})
		if used:
			frappe.throw(
				f"Cannot delete '{self.variant_type}': it is used in {used} variant entries. Remove them first."
			)
