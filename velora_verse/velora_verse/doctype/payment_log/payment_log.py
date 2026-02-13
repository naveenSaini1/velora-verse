# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import json

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class PaymentLog(Document):
	def validate(self):
		if not self.created_at:
			self.created_at = now_datetime()
		if not self.user:
			self.user = frappe.session.user


@frappe.whitelist()
def create_payment(order_name, payment_gateway="Razorpay"):
	"""Initiate a payment for an order. Returns payment details for frontend gateway integration."""
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

	if order.docstatus != 1:
		frappe.throw("Order must be submitted before payment.")

	result = {
		"order": order_name,
		"amount": order.total,
		"payment_gateway": payment_gateway,
	}

	razorpay_order_id = None

	# Try to create a real Razorpay order
	if payment_gateway == "Razorpay":
		from velora_verse.utils import get_store_settings

		settings = get_store_settings()
		if settings.razorpay_enabled:
			try:
				from velora_verse.services.payments import create_razorpay_order

				rz_order = create_razorpay_order(
					amount_inr=order.total,
					receipt=order_name,
					notes={"order": order_name, "user": user},
				)
				razorpay_order_id = rz_order["id"]
				result["razorpay_order_id"] = razorpay_order_id
				result["razorpay_key_id"] = settings.razorpay_key_id
				result["currency"] = "INR"
			except Exception as e:
				frappe.log_error(f"Razorpay order creation failed: {e}", "Razorpay Error")
				frappe.throw("Payment gateway error. Please try again.")

	# Create payment log entry
	log = frappe.new_doc("Payment Log")
	log.order = order_name
	log.user = user
	log.payment_gateway = payment_gateway
	log.amount = order.total
	log.status = "Initiated"
	log.razorpay_order_id = razorpay_order_id
	log.save(ignore_permissions=True)

	result["payment_log"] = log.name
	result["status"] = "Initiated"

	return result


@frappe.whitelist()
def verify_payment(
	order_name,
	transaction_id,
	payment_gateway="Razorpay",
	gateway_response=None,
	razorpay_order_id=None,
	razorpay_signature=None,
):
	"""Verify payment after gateway callback. Updates order and payment log."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to verify payment.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)
	if order.user != user and user != "Administrator":
		frappe.throw("You can only verify payment for your own orders.", frappe.PermissionError)

	# Verify Razorpay signature if provided
	if payment_gateway == "Razorpay" and razorpay_order_id and razorpay_signature:
		from velora_verse.utils import get_store_settings

		settings = get_store_settings()
		if settings.razorpay_enabled:
			from velora_verse.services.payments import verify_razorpay_signature

			if not verify_razorpay_signature(razorpay_order_id, transaction_id, razorpay_signature):
				# Log failed attempt
				_log_failed_payment(order_name, user, payment_gateway, transaction_id, "Signature verification failed")
				frappe.throw("Payment verification failed. Invalid signature.")

	# Find the initiated payment log for this order
	log_name = frappe.db.get_value(
		"Payment Log",
		{"order": order_name, "status": "Initiated"},
		"name",
		order_by="creation desc",
	)

	if log_name:
		log = frappe.get_doc("Payment Log", log_name)
		log.transaction_id = transaction_id
		log.status = "Success"
		log.gateway_response = gateway_response
		log.save(ignore_permissions=True)
	else:
		# Create a new log if no initiated one found
		log = frappe.new_doc("Payment Log")
		log.order = order_name
		log.user = user
		log.payment_gateway = payment_gateway
		log.transaction_id = transaction_id
		log.amount = order.total
		log.status = "Success"
		log.gateway_response = gateway_response
		log.razorpay_order_id = razorpay_order_id
		log.save(ignore_permissions=True)

	# Update order payment status
	frappe.db.set_value("Order", order_name, {
		"payment_status": "Paid",
		"payment_method": payment_gateway,
		"payment_id": transaction_id,
		"status": "Confirmed",
	})

	# Send payment confirmation email
	try:
		from velora_verse.services.notifications import send_order_email
		send_order_email(order_name, "payment_confirmation", "Payment Confirmed")
	except Exception:
		pass

	return {
		"message": "Payment verified",
		"order": order_name,
		"payment_log": log.name,
		"payment_status": "Paid",
	}


@frappe.whitelist(allow_guest=True, methods=["POST"])
def razorpay_webhook():
	"""Handle Razorpay webhook events (server-to-server fallback)."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	if not settings.razorpay_enabled:
		frappe.throw("Razorpay is not enabled.", frappe.PermissionError)

	# Verify webhook signature
	webhook_secret = settings.get_password("razorpay_webhook_secret")
	if webhook_secret:
		import hashlib
		import hmac

		webhook_body = frappe.request.get_data(as_text=True)
		webhook_signature = frappe.get_request_header("X-Razorpay-Signature")

		if webhook_signature:
			expected = hmac.new(
				webhook_secret.encode("utf-8"),
				webhook_body.encode("utf-8"),
				hashlib.sha256,
			).hexdigest()

			if not hmac.compare_digest(expected, webhook_signature):
				frappe.throw("Invalid webhook signature.", frappe.PermissionError)

	try:
		payload = json.loads(frappe.request.get_data(as_text=True))
	except json.JSONDecodeError:
		frappe.throw("Invalid JSON payload.")

	event = payload.get("event")

	if event == "payment.captured":
		_handle_payment_captured(payload)
	elif event == "refund.processed":
		_handle_refund_processed(payload)

	return {"status": "ok"}


def _handle_payment_captured(payload):
	"""Handle Razorpay payment.captured webhook event."""
	payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
	razorpay_order_id = payment.get("order_id")
	payment_id = payment.get("id")

	if not razorpay_order_id:
		return

	# Find the payment log with this Razorpay order ID
	log_name = frappe.db.get_value(
		"Payment Log",
		{"razorpay_order_id": razorpay_order_id},
		"name",
	)

	if not log_name:
		return

	log = frappe.get_doc("Payment Log", log_name)

	if log.status == "Success":
		return  # Already processed

	log.transaction_id = payment_id
	log.status = "Success"
	log.gateway_response = json.dumps(payment)
	log.save(ignore_permissions=True)

	# Update order
	frappe.db.set_value("Order", log.order, {
		"payment_status": "Paid",
		"payment_method": "Razorpay",
		"payment_id": payment_id,
		"status": "Confirmed",
	})
	frappe.db.commit()


def _handle_refund_processed(payload):
	"""Handle Razorpay refund.processed webhook event."""
	refund = payload.get("payload", {}).get("refund", {}).get("entity", {})
	payment_id = refund.get("payment_id")
	refund_id = refund.get("id")

	if not payment_id:
		return

	log_name = frappe.db.get_value(
		"Payment Log",
		{"transaction_id": payment_id, "status": "Success"},
		"name",
	)

	if not log_name:
		return

	log = frappe.get_doc("Payment Log", log_name)
	log.status = "Refunded"
	log.refund_id = refund_id
	log.save(ignore_permissions=True)

	frappe.db.set_value("Order", log.order, "payment_status", "Refunded")
	frappe.db.commit()


def _log_failed_payment(order_name, user, gateway, transaction_id, reason):
	"""Log a failed payment attempt."""
	log = frappe.new_doc("Payment Log")
	log.order = order_name
	log.user = user
	log.payment_gateway = gateway
	log.transaction_id = transaction_id
	log.amount = frappe.db.get_value("Order", order_name, "total") or 0
	log.status = "Failed"
	log.gateway_response = json.dumps({"error": reason})
	log.save(ignore_permissions=True)


@frappe.whitelist()
def process_cod_payment(order_name):
	"""Mark a COD order as paid (admin only)."""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Only Store Admin can confirm COD payments.", frappe.PermissionError)

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.")

	order = frappe.get_doc("Order", order_name)

	if order.payment_method != "COD":
		frappe.throw("This order is not a COD order.")

	if order.payment_status == "Paid":
		frappe.throw("This order is already marked as paid.")

	# Create payment log
	log = frappe.new_doc("Payment Log")
	log.order = order_name
	log.user = order.user
	log.payment_gateway = "COD"
	log.transaction_id = f"COD-{order_name}"
	log.amount = order.total
	log.status = "Success"
	log.save(ignore_permissions=True)

	frappe.db.set_value("Order", order_name, {
		"payment_status": "Paid",
		"payment_id": log.name,
	})

	return {"message": "COD payment confirmed", "order": order_name}
