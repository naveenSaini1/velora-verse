# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestCart(FrappeTestCase):
	def setUp(self):
		# Clean up cart
		if frappe.db.exists("Cart", "Administrator"):
			frappe.delete_doc("Cart", "Administrator", force=True)
			frappe.db.commit()

	def test_add_to_cart(self):
		from velora_verse.velora_verse.doctype.cart.cart import add_to_cart

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		result = add_to_cart(variants[0])
		self.assertEqual(result["message"], "Added to cart")
		self.assertTrue(result["total"] > 0)

	def test_duplicate_adds_quantity(self):
		from velora_verse.velora_verse.doctype.cart.cart import add_to_cart, get_cart

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		add_to_cart(variants[0], 1)
		add_to_cart(variants[0], 2)
		frappe.db.commit()

		cart = get_cart()
		self.assertEqual(cart["items"][0]["quantity"], 3)

	def test_remove_from_cart(self):
		from velora_verse.velora_verse.doctype.cart.cart import add_to_cart, remove_from_cart, get_cart

		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		add_to_cart(variants[0])
		frappe.db.commit()

		remove_from_cart(variants[0])
		frappe.db.commit()

		cart = get_cart()
		self.assertEqual(len(cart["items"]), 0)

	def test_quantity_validation(self):
		cart = frappe.new_doc("Cart")
		cart.user = "Administrator"
		cart.append("cart_items", {"variant": "NonExistentVariant", "quantity": 0})

		self.assertRaises(frappe.ValidationError, cart.insert, ignore_permissions=True)
