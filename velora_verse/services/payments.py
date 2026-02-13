# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Razorpay payment gateway integration."""

import hashlib
import hmac

import frappe
from velora_verse.utils import get_store_settings


def get_razorpay_client():
	"""Get an authenticated Razorpay client from Store Settings credentials."""
	settings = get_store_settings()

	if not settings.razorpay_enabled:
		frappe.throw("Razorpay is not enabled. Please configure it in Store Settings.")

	key_id = settings.razorpay_key_id
	key_secret = settings.get_password("razorpay_key_secret")

	if not key_id or not key_secret:
		frappe.throw("Razorpay credentials are not configured in Store Settings.")

	import razorpay
	return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount_inr, receipt, notes=None):
	"""
	Create a Razorpay order.

	Args:
		amount_inr: Amount in INR (will be converted to paise)
		receipt: Unique receipt ID (e.g., order name)
		notes: Optional dict of notes to attach

	Returns:
		Razorpay order object
	"""
	client = get_razorpay_client()

	amount_paise = int(round(float(amount_inr) * 100))

	data = {
		"amount": amount_paise,
		"currency": "INR",
		"receipt": receipt,
	}
	if notes:
		data["notes"] = notes

	return client.order.create(data=data)


def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
	"""
	Verify Razorpay payment signature using HMAC-SHA256.

	Returns True if signature is valid.
	"""
	settings = get_store_settings()
	key_secret = settings.get_password("razorpay_key_secret")

	if not key_secret:
		frappe.throw("Razorpay key secret not configured.")

	message = f"{razorpay_order_id}|{razorpay_payment_id}"
	expected_signature = hmac.new(
		key_secret.encode("utf-8"),
		message.encode("utf-8"),
		hashlib.sha256,
	).hexdigest()

	return hmac.compare_digest(expected_signature, razorpay_signature)


def initiate_refund(payment_id, amount_inr=None):
	"""
	Initiate a refund via Razorpay.

	Args:
		payment_id: Razorpay payment ID
		amount_inr: Partial refund amount in INR. None = full refund.

	Returns:
		Razorpay refund object
	"""
	client = get_razorpay_client()

	data = {}
	if amount_inr:
		data["amount"] = int(round(float(amount_inr) * 100))

	return client.payment.refund(payment_id, data)
