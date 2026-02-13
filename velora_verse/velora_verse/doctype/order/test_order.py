# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestOrder(FrappeTestCase):
	def setUp(self):
		# Clean up test orders
		for order in frappe.get_all("Order", filters={"user": "Administrator"}, pluck="name"):
			doc = frappe.get_doc("Order", order)
			if doc.docstatus == 1:
				doc.cancel()
			frappe.delete_doc("Order", order, force=True)

		# Clean up test address
		for addr in frappe.get_all("Address", filters={"full_name": "Test Order Addr"}, pluck="name"):
			frappe.delete_doc("Address", addr, force=True)

		# Clean up cart
		if frappe.db.exists("Cart", "Administrator"):
			frappe.delete_doc("Cart", "Administrator", force=True)

		frappe.db.commit()

	def _make_address(self):
		addr = frappe.new_doc("Address")
		addr.user = "Administrator"
		addr.full_name = "Test Order Addr"
		addr.phone = "9876543210"
		addr.address_line_1 = "123 Order Street"
		addr.city = "Mumbai"
		addr.state = "Maharashtra"
		addr.pincode = "400001"
		addr.country = "India"
		addr.address_type = "Shipping"
		addr.insert(ignore_permissions=True)
		frappe.db.commit()
		return addr

	def _make_order(self, variant_name, address_name, quantity=1):
		"""Create an order directly (not via cart) for testing."""
		variant = frappe.get_doc("Variants", variant_name)
		order = frappe.new_doc("Order")
		order.user = "Administrator"
		order.shipping_address = address_name
		order.append("order_items", {
			"variant": variant_name,
			"item_name": variant.variant_name,
			"variant_title": variant.title,
			"quantity": quantity,
			"rate": variant.price,
		})
		order.save(ignore_permissions=True)
		return order

	def test_order_creation(self):
		variants = frappe.get_all("Variants", limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants in database")

		addr = self._make_address()
		order = self._make_order(variants[0], addr.name)
		self.assertTrue(order.name.startswith("VV-ORD-"))
		self.assertEqual(order.status, "Pending")

	def test_order_totals_calculation(self):
		variants = frappe.get_all("Variants", filters={"price": [">", 0]}, limit=1, pluck="name")
		if not variants:
			self.skipTest("No variants with price in database")

		addr = self._make_address()
		order = self._make_order(variants[0], addr.name, quantity=2)
		self.assertEqual(order.subtotal, order.order_items[0].rate * 2)
		self.assertEqual(order.total, order.subtotal)

	def test_order_requires_items(self):
		addr = self._make_address()
		order = frappe.new_doc("Order")
		order.user = "Administrator"
		order.shipping_address = addr.name
		self.assertRaises(frappe.ValidationError, order.save, ignore_permissions=True)

	def test_stock_deducted_on_submit(self):
		variants = frappe.get_all(
			"Variants", filters={"quantity": [">", 2]}, limit=1,
			fields=["name", "quantity"],
		)
		if not variants:
			self.skipTest("No variants with sufficient stock")

		original_qty = variants[0].quantity
		addr = self._make_address()
		order = self._make_order(variants[0].name, addr.name, quantity=1)
		order.submit()
		frappe.db.commit()

		new_qty = frappe.db.get_value("Variants", variants[0].name, "quantity")
		self.assertEqual(new_qty, original_qty - 1)

	def test_stock_restored_on_cancel(self):
		variants = frappe.get_all(
			"Variants", filters={"quantity": [">", 2]}, limit=1,
			fields=["name", "quantity"],
		)
		if not variants:
			self.skipTest("No variants with sufficient stock")

		original_qty = variants[0].quantity
		addr = self._make_address()
		order = self._make_order(variants[0].name, addr.name, quantity=1)
		order.submit()
		frappe.db.commit()

		order.cancel()
		frappe.db.commit()

		restored_qty = frappe.db.get_value("Variants", variants[0].name, "quantity")
		self.assertEqual(restored_qty, original_qty)

	def test_place_order_from_cart(self):
		from velora_verse.velora_verse.doctype.cart.cart import add_to_cart
		from velora_verse.velora_verse.doctype.order.order import place_order

		variants = frappe.get_all(
			"Variants", filters={"quantity": [">", 2]}, limit=1, pluck="name",
		)
		if not variants:
			self.skipTest("No variants with sufficient stock")

		add_to_cart(variants[0], 1)
		frappe.db.commit()

		addr = self._make_address()
		result = place_order(shipping_address=addr.name)
		self.assertEqual(result["message"], "Order placed successfully")
		self.assertTrue(result["order"].startswith("VV-ORD-"))

	def test_cancel_order_api(self):
		from velora_verse.velora_verse.doctype.order.order import cancel_order

		variants = frappe.get_all(
			"Variants", filters={"quantity": [">", 2]}, limit=1, pluck="name",
		)
		if not variants:
			self.skipTest("No variants with sufficient stock")

		addr = self._make_address()
		order = self._make_order(variants[0], addr.name, quantity=1)
		order.submit()
		frappe.db.commit()

		result = cancel_order(order.name, reason="Test cancellation")
		self.assertEqual(result["message"], "Order cancelled")

	def test_get_orders_api(self):
		from velora_verse.velora_verse.doctype.order.order import get_orders

		result = get_orders()
		self.assertIn("orders", result)
		self.assertIn("total_count", result)
		self.assertIn("total_pages", result)
