# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Document event hooks for Velora Verse."""

import frappe


def clear_category_cache(doc, method):
	"""Clear category tree and product filters cache when a Category changes."""
	frappe.cache().delete_value("velora_verse:category_tree")
	frappe.cache().delete_value("velora_verse:product_filters")


def clear_product_filters_cache(doc, method):
	"""Clear product filters and featured products cache when an Item changes."""
	frappe.cache().delete_value("velora_verse:product_filters")
	# Invalidate featured products cache (all limit variants)
	for key in frappe.cache().get_keys("velora_verse:featured_products:*"):
		frappe.cache().delete_value(key)


def variant_on_update(doc, method):
	"""When a variant goes from out-of-stock to in-stock, notify subscribers."""
	prev = doc.get_doc_before_save()
	if not prev:
		return

	# Check if is_stock changed from 0 to 1
	if not prev.is_stock and doc.is_stock:
		# Trigger back-in-stock notifications asynchronously
		frappe.enqueue(
			_notify_back_in_stock,
			variant=doc.name,
			variant_title=doc.title,
			queue="short",
		)

	# Dispatch inventory webhook if quantity changed
	if prev.quantity != doc.quantity:
		_dispatch_inventory_webhook(doc)


def order_on_update_after_submit(doc, method):
	"""Dispatch webhooks when order status changes after submit."""
	prev = doc.get_doc_before_save()
	if not prev:
		return

	# Map status changes to webhook event types
	status_event_map = {
		"Shipped": "order.shipped",
		"Delivered": "order.delivered",
		"Cancelled": "order.cancelled",
	}

	if prev.status != doc.status and doc.status in status_event_map:
		_dispatch_order_webhook(status_event_map[doc.status], doc)

	# Payment status change
	if prev.payment_status != doc.payment_status and doc.payment_status == "Paid":
		_dispatch_order_webhook("order.paid", doc)


def _notify_back_in_stock(variant, variant_title):
	"""Send back-in-stock notifications to subscribers."""
	notifications = frappe.get_all(
		"Stock Notification",
		filters={"variant": variant, "notified": 0},
		fields=["name", "email"],
	)

	for notif in notifications:
		try:
			from velora_verse.services.notifications import send_back_in_stock_notification
			send_back_in_stock_notification(notif.email, variant_title, variant)

			frappe.db.set_value("Stock Notification", notif.name, {
				"notified": 1,
				"notified_on": frappe.utils.now_datetime(),
			})
		except Exception as e:
			frappe.log_error(f"Back-in-stock notification failed for {notif.name}: {e}", "Stock Notification")

	frappe.db.commit()


def _dispatch_order_webhook(event_type, order_doc):
	"""Dispatch a webhook event for an order."""
	try:
		from velora_verse.api.webhooks import dispatch_webhook_event
		dispatch_webhook_event(event_type, {
			"order": order_doc.name,
			"status": order_doc.status,
			"payment_status": order_doc.payment_status,
			"user": order_doc.user,
			"total": float(order_doc.total or 0),
		})
	except Exception as e:
		frappe.log_error(f"Webhook dispatch failed for {event_type}: {e}", "Webhook Dispatch")


def _dispatch_inventory_webhook(variant_doc):
	"""Dispatch inventory.updated webhook for a variant."""
	try:
		from velora_verse.api.webhooks import dispatch_webhook_event
		dispatch_webhook_event("inventory.updated", {
			"variant": variant_doc.name,
			"title": variant_doc.title,
			"quantity": variant_doc.quantity,
			"is_stock": variant_doc.is_stock,
		})
	except Exception as e:
		frappe.log_error(f"Inventory webhook failed: {e}", "Webhook Dispatch")
