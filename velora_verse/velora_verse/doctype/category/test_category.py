# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestCategory(FrappeTestCase):
	def setUp(self):
		for name in ["Test Cat A", "Test Cat B", "Test Cat C"]:
			if frappe.db.exists("Category", name):
				frappe.db.delete("Item Category", {"category": name})
				frappe.db.delete("Category", {"parent_category": name})
				frappe.delete_doc("Category", name, force=True)
		frappe.db.commit()

	def test_create_category(self):
		cat = frappe.new_doc("Category")
		cat.category_name = "Test Cat A"
		cat.insert(ignore_permissions=True)
		self.assertEqual(cat.name, "Test Cat A")

	def test_self_parent_blocked(self):
		cat = frappe.new_doc("Category")
		cat.category_name = "Test Cat A"
		cat.insert(ignore_permissions=True)
		frappe.db.commit()

		cat.parent_category = cat.name
		self.assertRaises(frappe.ValidationError, cat.save)

	def test_circular_reference_blocked(self):
		cat_a = frappe.new_doc("Category")
		cat_a.category_name = "Test Cat A"
		cat_a.insert(ignore_permissions=True)

		cat_b = frappe.new_doc("Category")
		cat_b.category_name = "Test Cat B"
		cat_b.parent_category = "Test Cat A"
		cat_b.is_child = 1
		cat_b.insert(ignore_permissions=True)
		frappe.db.commit()

		cat_a.parent_category = "Test Cat B"
		cat_a.is_child = 1
		self.assertRaises(frappe.ValidationError, cat_a.save)

	def test_cannot_delete_parent_with_children(self):
		cat_a = frappe.new_doc("Category")
		cat_a.category_name = "Test Cat A"
		cat_a.insert(ignore_permissions=True)

		cat_b = frappe.new_doc("Category")
		cat_b.category_name = "Test Cat B"
		cat_b.parent_category = "Test Cat A"
		cat_b.is_child = 1
		cat_b.insert(ignore_permissions=True)
		frappe.db.commit()

		self.assertRaises(frappe.ValidationError, cat_a.delete)
