# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Newsletter subscription API."""

import frappe
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address, now_datetime


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=5, seconds=60)
def subscribe(email):
	"""Subscribe an email to the newsletter."""
	if not email:
		frappe.throw("Email is required.")

	email = email.strip().lower()
	if not validate_email_address(email):
		frappe.throw("Please enter a valid email address.")

	# Check if already subscribed
	existing = frappe.db.exists("Newsletter Subscriber", email)
	if existing:
		# Re-activate if previously unsubscribed
		is_active = frappe.db.get_value("Newsletter Subscriber", email, "is_active")
		if not is_active:
			frappe.db.set_value("Newsletter Subscriber", email, "is_active", 1)
			frappe.db.commit()
			return {"message": "Welcome back! You've been re-subscribed."}
		return {"message": "You're already subscribed!"}

	doc = frappe.get_doc({
		"doctype": "Newsletter Subscriber",
		"email": email,
		"subscribed_at": now_datetime(),
		"is_active": 1,
	})
	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Thanks for subscribing!"}
