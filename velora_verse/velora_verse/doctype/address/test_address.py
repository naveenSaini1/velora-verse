# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestAddress(FrappeTestCase):
	def setUp(self):
		for addr in frappe.get_all("Address", filters={"full_name": ["like", "Test%"]}, pluck="name"):
			frappe.delete_doc("Address", addr, force=True)
		frappe.db.commit()

	def _make_address(self, **kwargs):
		defaults = {
			"user": "Administrator",
			"full_name": "Test User",
			"phone": "9876543210",
			"address_line_1": "123 Test Street",
			"city": "Mumbai",
			"state": "Maharashtra",
			"pincode": "400001",
			"country": "India",
			"address_type": "Shipping",
		}
		defaults.update(kwargs)
		address = frappe.new_doc("Address")
		for k, v in defaults.items():
			setattr(address, k, v)
		address.insert(ignore_permissions=True)
		return address

	def test_create_address(self):
		addr = self._make_address()
		self.assertTrue(addr.name)
		self.assertEqual(addr.city, "Mumbai")

	def test_phone_validation(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_address,
			full_name="Test Bad Phone",
			phone="abc@xyz",
		)

	def test_pincode_validation(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_address,
			full_name="Test Bad Pincode",
			pincode="400@01!",
		)

	def test_only_one_default_per_type(self):
		addr1 = self._make_address(full_name="Test Default 1", is_default=1)
		addr2 = self._make_address(full_name="Test Default 2", is_default=1)
		frappe.db.commit()

		# Reload addr1 — should no longer be default
		addr1.reload()
		self.assertEqual(addr1.is_default, 0)
		self.assertEqual(addr2.is_default, 1)

	def test_get_addresses_api(self):
		from velora_verse.velora_verse.doctype.address.address import get_addresses

		self._make_address(full_name="Test API Address")
		frappe.db.commit()

		result = get_addresses()
		self.assertIsInstance(result["addresses"], list)
		self.assertTrue(len(result["addresses"]) >= 1)

	def test_add_address_api(self):
		from velora_verse.velora_verse.doctype.address.address import add_address

		result = add_address(
			full_name="Test API Add",
			phone="1234567890",
			address_line_1="456 New Street",
			city="Delhi",
			state="Delhi",
			pincode="110001",
		)
		self.assertEqual(result["message"], "Address added")
		self.assertTrue(result["address"])

	def test_delete_address_api(self):
		from velora_verse.velora_verse.doctype.address.address import add_address, delete_address

		result = add_address(
			full_name="Test API Delete",
			phone="1234567890",
			address_line_1="789 Del Street",
			city="Pune",
			state="Maharashtra",
			pincode="411001",
		)
		frappe.db.commit()

		del_result = delete_address(result["address"])
		self.assertEqual(del_result["message"], "Address deleted")
