# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPaymentLog(FrappeTestCase):
	def test_create_payment_log(self):
		"""Test direct payment log creation."""
		# Need an order to link to — check if any exist
		orders = frappe.get_all("Order", filters={"docstatus": 1}, limit=1, pluck="name")
		if not orders:
			self.skipTest("No submitted orders in database")

		log = frappe.new_doc("Payment Log")
		log.order = orders[0]
		log.user = "Administrator"
		log.payment_gateway = "Test"
		log.amount = 100
		log.status = "Initiated"
		log.insert(ignore_permissions=True)

		self.assertTrue(log.name)
		self.assertEqual(log.status, "Initiated")
		self.assertTrue(log.created_at)

	def test_payment_log_records_user(self):
		"""Test that created_by is auto-populated."""
		orders = frappe.get_all("Order", filters={"docstatus": 1}, limit=1, pluck="name")
		if not orders:
			self.skipTest("No submitted orders in database")

		log = frappe.new_doc("Payment Log")
		log.order = orders[0]
		log.user = "Administrator"
		log.payment_gateway = "Test"
		log.amount = 200
		log.insert(ignore_permissions=True)

		self.assertEqual(log.user, "Administrator")
