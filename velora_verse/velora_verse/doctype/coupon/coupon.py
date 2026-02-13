# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.rate_limiter import rate_limit
from frappe.utils import now_datetime, getdate


class Coupon(Document):
	def before_naming(self):
		self.coupon_code = (self.coupon_code or "").strip().upper()

	def validate(self):
		self.validate_discount_value()
		self.validate_dates()

	def validate_discount_value(self):
		if not self.discount_value or self.discount_value <= 0:
			frappe.throw("Discount value must be greater than 0.")

		if self.discount_type == "Percentage" and self.discount_value > 100:
			frappe.throw("Percentage discount cannot exceed 100%.")

	def validate_dates(self):
		if self.valid_from and self.valid_to:
			if self.valid_from > self.valid_to:
				frappe.throw("'Valid From' must be before 'Valid To'.")


def _validate_coupon(coupon_code, subtotal, user):
	"""Validate a coupon and return the coupon doc. Throws on invalid."""
	coupon_code = (coupon_code or "").strip().upper()

	if not frappe.db.exists("Coupon", coupon_code):
		frappe.throw("Invalid coupon code.")

	coupon = frappe.get_doc("Coupon", coupon_code)

	if not coupon.is_active:
		frappe.throw("This coupon is no longer active.")

	now = now_datetime()
	if coupon.valid_from and now < coupon.valid_from:
		frappe.throw("This coupon is not yet valid.")
	if coupon.valid_to and now > coupon.valid_to:
		frappe.throw("This coupon has expired.")

	if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
		frappe.throw("This coupon has reached its usage limit.")

	if coupon.per_user_limit:
		user_usage = frappe.db.count("Order", {
			"coupon_code": coupon_code,
			"user": user,
			"docstatus": 1,
		})
		if user_usage >= coupon.per_user_limit:
			frappe.throw("You have already used this coupon the maximum number of times.")

	if coupon.min_order_value and subtotal < coupon.min_order_value:
		frappe.throw(f"Minimum order value of {coupon.min_order_value} required for this coupon.")

	# Check item/category scope if applicable_items is set
	if coupon.applicable_items:
		# Scope validation will be done at order level if needed
		pass

	return coupon


@frappe.whitelist()
@rate_limit(limit=20, seconds=60)
def validate_coupon(coupon_code):
	"""Validate a coupon code and return discount preview based on current cart."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to use coupons.")

	# Get cart subtotal
	cart_name = frappe.db.get_value("Cart", {"user": user})
	if not cart_name:
		frappe.throw("Your cart is empty.")

	cart = frappe.get_doc("Cart", cart_name)
	if not cart.cart_items:
		frappe.throw("Your cart is empty.")

	subtotal = cart.total or 0

	coupon = _validate_coupon(coupon_code, subtotal, user)

	# Calculate discount preview
	if coupon.discount_type == "Percentage":
		discount = subtotal * (coupon.discount_value / 100)
		if coupon.max_discount and discount > coupon.max_discount:
			discount = coupon.max_discount
	else:
		discount = coupon.discount_value

	if discount > subtotal:
		discount = subtotal

	return {
		"valid": True,
		"coupon_code": coupon.coupon_code,
		"description": coupon.description,
		"discount_type": coupon.discount_type,
		"discount_value": coupon.discount_value,
		"discount_amount": discount,
		"new_total": subtotal - discount,
	}


@frappe.whitelist()
@rate_limit(limit=10, seconds=60)
def apply_coupon(coupon_code):
	"""Validate and return the discount for use during checkout."""
	return validate_coupon(coupon_code)
