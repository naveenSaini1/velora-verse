# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestInventoryLog(FrappeTestCase):
	def test_restock_variant(self):
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import restock_variant

		variants = frappe.get_all("Variants", limit=1, fields=["name", "quantity"])
		if not variants:
			self.skipTest("No variants in database")

		original_qty = variants[0].quantity or 0
		result = restock_variant(variants[0].name, 10)

		self.assertEqual(result["previous_qty"], original_qty)
		self.assertEqual(result["new_qty"], original_qty + 10)
		self.assertTrue(result["log"])

		# Verify database
		new_qty = frappe.db.get_value("Variants", variants[0].name, "quantity")
		self.assertEqual(new_qty, original_qty + 10)

		# Restore
		frappe.db.set_value("Variants", variants[0].name, "quantity", original_qty)
		frappe.db.commit()

	def test_adjust_stock(self):
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import adjust_stock

		variants = frappe.get_all("Variants", limit=1, fields=["name", "quantity"])
		if not variants:
			self.skipTest("No variants in database")

		original_qty = variants[0].quantity or 0
		result = adjust_stock(variants[0].name, 50, reason="Test adjustment")

		self.assertEqual(result["new_qty"], 50)
		self.assertTrue(result["log"])

		# Verify log was created
		log = frappe.get_doc("Inventory Log", result["log"])
		self.assertEqual(log.change_type, "Adjustment")
		self.assertEqual(log.new_qty, 50)

		# Restore
		frappe.db.set_value("Variants", variants[0].name, "quantity", original_qty)
		frappe.db.commit()

	def test_restock_invalid_variant(self):
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import restock_variant

		self.assertRaises(frappe.ValidationError, restock_variant, "NONEXISTENT", 10)

	def test_restock_negative_quantity(self):
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import restock_variant

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		self.assertRaises(frappe.ValidationError, restock_variant, variants[0], -5)

	def test_adjust_stock_negative(self):
		from velora_verse.velora_verse.doctype.inventory_log.inventory_log import adjust_stock

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		self.assertRaises(frappe.ValidationError, adjust_stock, variants[0], -1)
