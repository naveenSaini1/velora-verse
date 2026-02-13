# Copyright (c) 2026, velora-verse and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import now_datetime, add_days


class TestCoupon(FrappeTestCase):
	def setUp(self):
		for c in frappe.get_all("Coupon", filters={"coupon_code": ["like", "TEST%"]}, pluck="name"):
			frappe.delete_doc("Coupon", c, force=True)
		frappe.db.commit()

	def _make_coupon(self, **kwargs):
		defaults = {
			"coupon_code": "TEST20",
			"discount_type": "Percentage",
			"discount_value": 20,
			"valid_from": now_datetime(),
			"valid_to": add_days(now_datetime(), 30),
			"is_active": 1,
		}
		defaults.update(kwargs)
		coupon = frappe.new_doc("Coupon")
		for k, v in defaults.items():
			setattr(coupon, k, v)
		coupon.insert(ignore_permissions=True)
		return coupon

	def test_create_coupon(self):
		coupon = self._make_coupon()
		self.assertEqual(coupon.coupon_code, "TEST20")

	def test_coupon_code_uppercased(self):
		coupon = self._make_coupon(coupon_code="testlower")
		self.assertEqual(coupon.coupon_code, "TESTLOWER")

	def test_percentage_max_100(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_coupon,
			coupon_code="TESTOVER",
			discount_value=150,
		)

	def test_discount_value_positive(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_coupon,
			coupon_code="TESTZERO",
			discount_value=0,
		)

	def test_valid_from_before_valid_to(self):
		self.assertRaises(
			frappe.ValidationError,
			self._make_coupon,
			coupon_code="TESTDATE",
			valid_from=add_days(now_datetime(), 30),
			valid_to=now_datetime(),
		)

	def test_flat_discount(self):
		coupon = self._make_coupon(
			coupon_code="TESTFLAT",
			discount_type="Flat",
			discount_value=500,
		)
		self.assertEqual(coupon.discount_type, "Flat")
		self.assertEqual(coupon.discount_value, 500)

	def test_validate_coupon_api(self):
		from velora_verse.velora_verse.doctype.coupon.coupon import _validate_coupon

		self._make_coupon(coupon_code="TESTVALID")
		frappe.db.commit()

		coupon = _validate_coupon("TESTVALID", 1000, "Administrator")
		self.assertEqual(coupon.coupon_code, "TESTVALID")

	def test_expired_coupon_rejected(self):
		from velora_verse.velora_verse.doctype.coupon.coupon import _validate_coupon

		self._make_coupon(
			coupon_code="TESTEXP",
			valid_from=add_days(now_datetime(), -60),
			valid_to=add_days(now_datetime(), -1),
		)
		frappe.db.commit()

		self.assertRaises(frappe.ValidationError, _validate_coupon, "TESTEXP", 1000, "Administrator")

	def test_inactive_coupon_rejected(self):
		from velora_verse.velora_verse.doctype.coupon.coupon import _validate_coupon

		self._make_coupon(coupon_code="TESTINACTIVE", is_active=0)
		frappe.db.commit()

		self.assertRaises(frappe.ValidationError, _validate_coupon, "TESTINACTIVE", 1000, "Administrator")
