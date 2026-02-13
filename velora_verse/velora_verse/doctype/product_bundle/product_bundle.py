# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import re


class ProductBundle(Document):
	def validate(self):
		self.calculate_savings()
		if not self.slug:
			self.slug = re.sub(r'[^a-z0-9]+', '-', self.bundle_name.lower()).strip('-')

	def calculate_savings(self):
		total = 0
		for row in self.bundle_items or []:
			if row.variant:
				price = row.individual_price or frappe.db.get_value("Variants", row.variant, "price") or 0
				row.individual_price = price
				total += price * (row.bundle_quantity or 1)
		self.individual_total = total
		self.savings_amount = max(0, total - (self.bundle_price or 0))
		self.savings_percentage = round((self.savings_amount / total * 100), 2) if total > 0 else 0
