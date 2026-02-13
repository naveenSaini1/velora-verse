# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Payment gateway APIs for the storefront frontend."""

import frappe
from velora_verse.utils import get_store_settings


@frappe.whitelist()
def create_payment(order_name, payment_method="Razorpay"):
	"""Create a payment session for an order.

	Args:
		order_name: The Order document name
		payment_method: Payment method (default "Razorpay")

	Returns:
		Payment details including razorpay_order_id and key_id
	"""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to make a payment.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)
	if order.user != user and user != "Administrator":
		frappe.throw("You can only pay for your own orders.", frappe.PermissionError)

	if order.payment_status == "Paid":
		frappe.throw("This order has already been paid.")

	settings = get_store_settings()

	if payment_method == "Razorpay":
		if not settings.razorpay_enabled:
			frappe.throw("Razorpay payments are not enabled.")

		from velora_verse.services.payments import create_razorpay_order

		razorpay_order = create_razorpay_order(
			amount_inr=order.total,
			receipt=order.name,
			notes={"order": order.name, "user": user},
		)

		return {
			"payment_method": "Razorpay",
			"razorpay_order_id": razorpay_order["id"],
			"razorpay_key_id": settings.razorpay_key_id,
			"amount": order.total,
			"currency": "INR",
			"order_name": order.name,
		}

	elif payment_method == "COD":
		return {
			"payment_method": "COD",
			"order_name": order.name,
			"amount": order.total,
			"message": "Pay on delivery",
		}

	frappe.throw(f"Unsupported payment method: {payment_method}")


@frappe.whitelist()
def verify_payment(order_name, razorpay_payment_id, razorpay_order_id, razorpay_signature):
	"""Verify a Razorpay payment and update the order.

	Args:
		order_name: The Order document name
		razorpay_payment_id: Payment ID from Razorpay
		razorpay_order_id: Order ID from Razorpay
		razorpay_signature: Signature from Razorpay for verification

	Returns:
		Payment verification result
	"""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)
	if order.user != user and user != "Administrator":
		frappe.throw("You can only verify payments for your own orders.", frappe.PermissionError)

	from velora_verse.services.payments import verify_razorpay_signature

	is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

	if not is_valid:
		frappe.throw("Payment verification failed. Invalid signature.")

	# Update order with payment details
	frappe.db.set_value("Order", order_name, {
		"payment_id": razorpay_payment_id,
		"payment_status": "Paid",
		"status": "Confirmed",
	})

	return {
		"verified": True,
		"order_name": order_name,
		"payment_id": razorpay_payment_id,
		"message": "Payment verified successfully",
	}
