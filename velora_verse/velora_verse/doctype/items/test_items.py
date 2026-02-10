# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestItems(FrappeTestCase):
	def _make_item(self, name="Test Item", price=100, **kwargs):
		item = frappe.new_doc("Items")
		item.item_name = name
		item.base_price = price
		for k, v in kwargs.items():
			setattr(item, k, v)
		item.insert(ignore_permissions=True)
		return item

	def setUp(self):
		for item in frappe.get_all("Items", filters={"item_name": ["like", "Test%"]}, pluck="name"):
			for v in frappe.get_all("Variants", filters={"variant_name": item}, pluck="name"):
				frappe.delete_doc("Variants", v, force=True)
			frappe.delete_doc("Items", item, force=True)
		frappe.db.commit()

	def test_create_item(self):
		item = self._make_item("Test Create Item")
		self.assertTrue(item.name.startswith("ITEM-"))

	def test_base_price_must_be_positive(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_item,
			"Test Negative Price",
			price=-10,
		)

	def test_sku_format_validation(self):
		item = self._make_item("Test SKU Valid", sku="ABC-123_XY")
		self.assertEqual(item.sku, "ABC-123_XY")

		self.assertRaises(
			frappe.ValidationError,
			self._make_item,
			"Test SKU Invalid",
			sku="ABC 123!@#",
		)

	def test_duplicate_category_blocked(self):
		item = frappe.new_doc("Items")
		item.item_name = "Test Dup Cat"
		item.base_price = 100

		cats = frappe.get_all("Category", limit=1, pluck="name")
		if not cats:
			self.skipTest("No categories")

		item.append("category", {"category": cats[0]})
		item.append("category", {"category": cats[0]})

		self.assertRaises(frappe.ValidationError, item.insert, ignore_permissions=True)

	def test_cannot_delete_item_with_variants(self):
		item = self._make_item("Test No Delete")
		frappe.db.commit()

		vtype = frappe.get_all("Variants Type", limit=1, pluck="name")
		vprop = frappe.get_all("Variant Properties", limit=1, pluck="name")
		if vtype and vprop:
			variant = frappe.new_doc("Variants")
			variant.variant_name = item.name
			variant.price = 100
			variant.append("variant_values", {"type": vtype[0], "value": vprop[0]})
			variant.insert(ignore_permissions=True)
			frappe.db.commit()

			self.assertRaises(frappe.ValidationError, item.delete)
