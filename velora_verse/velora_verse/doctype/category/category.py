# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Category(Document):
	def validate(self):
		self.validate_circular_reference()

	def on_trash(self):
		self.validate_no_children()
		self.validate_no_items()

	def validate_circular_reference(self):
		if not self.parent_category:
			return

		if self.parent_category == self.name:
			frappe.throw("A category cannot be its own parent.")

		# Walk up the tree to detect cycles
		visited = {self.name}
		current = self.parent_category
		while current:
			if current in visited:
				frappe.throw(f"Circular reference detected: '{current}' is already in the parent chain.")
			visited.add(current)
			current = frappe.db.get_value("Category", current, "parent_category")

	def validate_no_children(self):
		children = frappe.db.count("Category", {"parent_category": self.name})
		if children:
			frappe.throw(f"Cannot delete '{self.name}': it has {children} child categories. Delete them first.")

	def validate_no_items(self):
		items = frappe.db.count("Item Category", {"category": self.name})
		if items:
			frappe.throw(f"Cannot delete '{self.name}': it is assigned to {items} items. Remove the assignment first.")
