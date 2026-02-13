# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Notification center APIs for customer-facing notifications."""

import frappe
from frappe.utils import now_datetime


@frappe.whitelist()
def get_notifications(page=1, limit=20, unread_only=False):
	"""Get the current user's notifications with pagination."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view notifications.")

	page = max(1, int(page))
	limit = min(50, max(1, int(limit)))
	offset = (page - 1) * limit

	filters = {"user": user}
	if int(unread_only):
		filters["is_read"] = 0

	total_count = frappe.db.count("User Notification", filters)

	notifications = frappe.get_all(
		"User Notification",
		filters=filters,
		fields=[
			"name", "notification_type", "title_text as title", "message",
			"is_read", "reference_doctype", "reference_name",
			"action_url", "creation",
		],
		order_by="creation desc",
		limit_page_length=limit,
		limit_start=offset,
	)

	total_pages = (total_count + limit - 1) // limit if total_count else 0

	return {
		"items": notifications,
		"has_next": page < total_pages,
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": total_pages,
	}


@frappe.whitelist()
def get_unread_count():
	"""Get unread notification count for the current user."""
	user = frappe.session.user
	if user == "Guest":
		return {"count": 0}

	count = frappe.db.count("User Notification", {"user": user, "is_read": 0})
	return {"count": count}


@frappe.whitelist()
def mark_as_read(notification_name):
	"""Mark a specific notification as read."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	if not frappe.db.exists("User Notification", notification_name):
		frappe.throw("Notification not found.")

	notif_user = frappe.db.get_value("User Notification", notification_name, "user")
	if notif_user != user and user != "Administrator":
		frappe.throw("You can only manage your own notifications.", frappe.PermissionError)

	frappe.db.set_value("User Notification", notification_name, "is_read", 1)
	return {"message": "Marked as read"}


@frappe.whitelist()
def mark_all_read():
	"""Mark all notifications as read for the current user."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	frappe.db.sql("""
		UPDATE `tabUser Notification`
		SET is_read = 1
		WHERE user = %s AND is_read = 0
	""", user)

	return {"message": "All notifications marked as read"}


@frappe.whitelist()
def delete_notification(notification_name):
	"""Delete a notification."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	if not frappe.db.exists("User Notification", notification_name):
		frappe.throw("Notification not found.")

	notif_user = frappe.db.get_value("User Notification", notification_name, "user")
	if notif_user != user and user != "Administrator":
		frappe.throw("You can only manage your own notifications.", frappe.PermissionError)

	frappe.delete_doc("User Notification", notification_name, ignore_permissions=True)
	return {"message": "Notification deleted"}


def create_user_notification(user, notification_type, title_text, message=None,
	reference_doctype=None, reference_name=None, action_url=None):
	"""Internal helper to create a notification for a user."""
	doc = frappe.new_doc("User Notification")
	doc.user = user
	doc.notification_type = notification_type
	doc.title_text = title_text
	doc.message = message
	doc.reference_doctype = reference_doctype
	doc.reference_name = reference_name
	doc.action_url = action_url
	doc.insert(ignore_permissions=True)
	return doc.name
