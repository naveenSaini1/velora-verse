# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockNotification(Document):
	def validate(self):
		if not self.email:
			self.email = frappe.db.get_value("User", self.user, "email") or self.user


@frappe.whitelist()
def subscribe_stock_notification(variant):
	"""Subscribe to back-in-stock notification for a variant."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to subscribe to stock notifications.")

	if not frappe.db.exists("Variants", variant):
		frappe.throw("Variant not found.")

	# Check if already subscribed
	existing = frappe.db.exists("Stock Notification", {
		"user": user,
		"variant": variant,
		"notified": 0,
	})
	if existing:
		return {"message": "Already subscribed", "subscribed": True}

	doc = frappe.get_doc({
		"doctype": "Stock Notification",
		"user": user,
		"variant": variant,
		"email": user,
	})
	doc.insert(ignore_permissions=True)

	return {"message": "Subscribed for stock notification", "subscribed": True}


@frappe.whitelist()
def unsubscribe_stock_notification(variant):
	"""Unsubscribe from back-in-stock notification for a variant."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	notifications = frappe.get_all(
		"Stock Notification",
		filters={"user": user, "variant": variant, "notified": 0},
		pluck="name",
	)

	for name in notifications:
		frappe.delete_doc("Stock Notification", name, ignore_permissions=True)

	return {"message": "Unsubscribed", "subscribed": False}


@frappe.whitelist()
def check_stock_subscription(variant):
	"""Check if the current user is subscribed to stock notifications for a variant."""
	user = frappe.session.user
	if user == "Guest":
		return {"subscribed": False}

	exists = frappe.db.exists("Stock Notification", {
		"user": user,
		"variant": variant,
		"notified": 0,
	})

	return {"subscribed": bool(exists)}
