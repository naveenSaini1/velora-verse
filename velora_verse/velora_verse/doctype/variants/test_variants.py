# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestVariants(FrappeTestCase):
	def setUp(self):
		for v in frappe.get_all("Variants", filters={"title": ["like", "Test%"]}, pluck="name"):
			frappe.delete_doc("Variants", v, force=True)
		for item in frappe.get_all("Items", filters={"item_name": ["like", "Test Variant%"]}, pluck="name"):
			frappe.delete_doc("Items", item, force=True)
		frappe.db.commit()

	def _make_test_item(self):
		if frappe.db.exists("Items", {"item_name": "Test Variant Item"}):
			return frappe.db.get_value("Items", {"item_name": "Test Variant Item"})
		item = frappe.new_doc("Items")
		item.item_name = "Test Variant Item"
		item.base_price = 500
		item.insert(ignore_permissions=True)
		frappe.db.commit()
		return item.name

	def test_title_generation(self):
		item_name = self._make_test_item()
		vtypes = frappe.get_all("Variants Type", limit=1, pluck="name")
		vprops = frappe.get_all("Variant Properties", limit=1, pluck="name")
		if not vtypes or not vprops:
			self.skipTest("No variant types/properties")

		variant = frappe.new_doc("Variants")
		variant.variant_name = item_name
		variant.append("variant_values", {"type": vtypes[0], "value": vprops[0]})
		variant.insert(ignore_permissions=True)

		self.assertIn("Test Variant Item", variant.title)

	def test_default_price_from_item(self):
		item_name = self._make_test_item()
		vtypes = frappe.get_all("Variants Type", limit=1, pluck="name")
		vprops = frappe.get_all("Variant Properties", limit=1, pluck="name")
		if not vtypes or not vprops:
			self.skipTest("No variant types/properties")

		variant = frappe.new_doc("Variants")
		variant.variant_name = item_name
		variant.append("variant_values", {"type": vtypes[0], "value": vprops[0]})
		variant.insert(ignore_permissions=True)

		self.assertEqual(float(variant.price), 500.0)

	def test_negative_price_rejected(self):
		item_name = self._make_test_item()
		vtypes = frappe.get_all("Variants Type", limit=1, pluck="name")
		vprops = frappe.get_all("Variant Properties", limit=1, pluck="name")
		if not vtypes or not vprops:
			self.skipTest("No variant types/properties")

		variant = frappe.new_doc("Variants")
		variant.variant_name = item_name
		variant.price = -100
		variant.append("variant_values", {"type": vtypes[0], "value": vprops[0]})

		self.assertRaises(frappe.ValidationError, variant.insert, ignore_permissions=True)

	def test_variant_values_required(self):
		item_name = self._make_test_item()

		variant = frappe.new_doc("Variants")
		variant.variant_name = item_name

		self.assertRaises(frappe.ValidationError, variant.insert, ignore_permissions=True)

	def test_stock_status_updates_parent(self):
		item_name = self._make_test_item()
		vtypes = frappe.get_all("Variants Type", limit=1, pluck="name")
		vprops = frappe.get_all("Variant Properties", limit=1, pluck="name")
		if not vtypes or not vprops:
			self.skipTest("No variant types/properties")

		variant = frappe.new_doc("Variants")
		variant.variant_name = item_name
		variant.is_stock = 1
		variant.append("variant_values", {"type": vtypes[0], "value": vprops[0]})
		variant.insert(ignore_permissions=True)
		frappe.db.commit()

		in_stock = frappe.db.get_value("Items", item_name, "in_stock")
		self.assertEqual(in_stock, 1)
