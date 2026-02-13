# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Scheduled tasks for Velora Verse."""

import frappe
from frappe.utils import now_datetime, add_to_date


def cancel_unpaid_orders():
	"""Cancel orders that remain unpaid beyond the configured hours (exclude COD)."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	hours = settings.auto_cancel_unpaid_hours or 0

	if not hours:
		return

	cutoff = add_to_date(now_datetime(), hours=-hours)

	unpaid_orders = frappe.get_all(
		"Order",
		filters={
			"payment_status": "Unpaid",
			"payment_method": ["not in", ["COD", "Cash on Delivery"]],
			"status": ["in", ["Pending"]],
			"docstatus": 1,
			"order_date": ["<", cutoff],
		},
		pluck="name",
	)

	for order_name in unpaid_orders:
		try:
			order = frappe.get_doc("Order", order_name)
			order.cancelled_reason = f"Auto-cancelled: unpaid after {hours} hours"
			order.flags.ignore_permissions = True
			order.cancel()
			frappe.db.commit()
		except Exception as e:
			frappe.log_error(f"Auto-cancel failed for {order_name}: {e}", "Auto Cancel Order")
			frappe.db.rollback()


def check_low_stock():
	"""Check for low stock variants and send alert email to admin."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	if not settings.enable_low_stock_alerts:
		return

	threshold = settings.low_stock_threshold or 5
	alert_email = settings.low_stock_alert_email or settings.store_email

	if not alert_email:
		return

	low_stock = frappe.db.sql("""
		SELECT v.name, v.title, v.quantity, v.variant_name,
			i.item_name
		FROM `tabVariants` v
		LEFT JOIN `tabItems` i ON i.name = v.variant_name
		WHERE v.quantity <= %(threshold)s
		AND v.quantity > 0
		AND i.status = 'Active'
		ORDER BY v.quantity ASC
	""", {"threshold": threshold}, as_dict=True)

	out_of_stock = frappe.db.sql("""
		SELECT v.name, v.title, v.variant_name,
			i.item_name
		FROM `tabVariants` v
		LEFT JOIN `tabItems` i ON i.name = v.variant_name
		WHERE v.quantity = 0
		AND v.is_stock = 0
		AND i.status = 'Active'
		ORDER BY v.title ASC
	""", as_dict=True)

	if not low_stock and not out_of_stock:
		return

	try:
		from velora_verse.services.notifications import send_low_stock_alert
		send_low_stock_alert(alert_email, low_stock, out_of_stock, threshold)
	except Exception as e:
		frappe.log_error(f"Low stock alert failed: {e}", "Low Stock Alert")


def send_abandoned_cart_emails():
	"""Send reminder emails for abandoned carts."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	if not settings.enable_abandoned_cart_email:
		return

	hours = settings.abandoned_cart_hours or 48
	cutoff = add_to_date(now_datetime(), hours=-hours)

	# Find carts that are abandoned (modified before cutoff, have items, not recently reminded)
	abandoned_carts = frappe.db.sql("""
		SELECT c.name, c.user, c.total, c.modified, c.last_reminded_on
		FROM `tabCart` c
		INNER JOIN `tabCart Items` ci ON ci.parent = c.name
		WHERE c.modified < %(cutoff)s
		AND c.total > 0
		AND (c.last_reminded_on IS NULL OR c.last_reminded_on < %(cutoff)s)
		GROUP BY c.name
	""", {"cutoff": cutoff}, as_dict=True)

	for cart in abandoned_carts:
		# Check if user has placed an order after the cart was last modified
		recent_order = frappe.db.exists(
			"Order",
			{"user": cart.user, "creation": [">", cart.modified], "docstatus": 1},
		)
		if recent_order:
			continue

		try:
			# Get cart items with variant details
			cart_items = frappe.db.sql("""
				SELECT ci.variant, ci.quantity, ci.rate, v.title as variant_title
				FROM `tabCart Items` ci
				LEFT JOIN `tabVariants` v ON v.name = ci.variant
				WHERE ci.parent = %(cart)s
			""", {"cart": cart.name}, as_dict=True)

			if not cart_items:
				continue

			from velora_verse.services.notifications import send_abandoned_cart_email
			send_abandoned_cart_email(cart.user, cart_items, cart.total)

			frappe.db.set_value("Cart", cart.name, "last_reminded_on", now_datetime())
			frappe.db.commit()
		except Exception as e:
			frappe.log_error(f"Abandoned cart email failed for {cart.name}: {e}", "Abandoned Cart")
			frappe.db.rollback()


def cleanup_old_views():
	"""Delete recent view records older than 90 days."""
	cutoff = add_to_date(now_datetime(), days=-90)
	old_views = frappe.get_all(
		"Recent View",
		filters={"viewed_on": ["<", cutoff]},
		pluck="name",
	)

	for name in old_views:
		frappe.delete_doc("Recent View", name, ignore_permissions=True)

	if old_views:
		frappe.db.commit()


def check_back_in_stock():
	"""Notify subscribers when variants come back in stock."""
	notifications = frappe.get_all(
		"Stock Notification",
		filters={"notified": 0},
		fields=["name", "user", "variant", "email"],
	)

	if not notifications:
		return

	for notif in notifications:
		is_stock = frappe.db.get_value("Variants", notif.variant, "is_stock")
		if not is_stock:
			continue

		try:
			from velora_verse.services.notifications import send_back_in_stock_notification
			variant_title = frappe.db.get_value("Variants", notif.variant, "title")
			send_back_in_stock_notification(notif.email, variant_title, notif.variant)

			frappe.db.set_value("Stock Notification", notif.name, {
				"notified": 1,
				"notified_on": now_datetime(),
			})
			frappe.db.commit()
		except Exception as e:
			frappe.log_error(f"Back-in-stock notification failed for {notif.name}: {e}", "Stock Notification")
			frappe.db.rollback()


def activate_deactivate_promotions():
	"""Auto-toggle promotions based on start/end datetime (runs every 5 min)."""
	now = now_datetime()

	# Activate promotions whose start_datetime has arrived
	to_activate = frappe.get_all(
		"Promotion",
		filters={
			"is_active": 0,
			"start_datetime": ["<=", now],
			"end_datetime": [">", now],
		},
		pluck="name",
	)
	for name in to_activate:
		frappe.db.set_value("Promotion", name, "is_active", 1)

	# Deactivate promotions whose end_datetime has passed
	to_deactivate = frappe.get_all(
		"Promotion",
		filters={
			"is_active": 1,
			"end_datetime": ["<=", now],
		},
		pluck="name",
	)
	for name in to_deactivate:
		frappe.db.set_value("Promotion", name, "is_active", 0)

	if to_activate or to_deactivate:
		frappe.db.commit()


def expire_loyalty_points():
	"""Expire loyalty points past their expiry date."""
	try:
		from velora_verse.api.loyalty import expire_loyalty_points as _expire
		_expire()
	except Exception as e:
		frappe.log_error(f"Loyalty points expiry failed: {e}", "Loyalty Points Expiry")


def expire_gift_cards():
	"""Expire gift cards past their expiry date."""
	try:
		from velora_verse.api.gift_cards import expire_gift_cards as _expire
		_expire()
	except Exception as e:
		frappe.log_error(f"Gift card expiry failed: {e}", "Gift Card Expiry")


def reassign_customer_segments():
	"""Re-evaluate automatic customer segments daily."""
	try:
		from velora_verse.api.segments import reassign_customer_segments as _reassign
		_reassign()
	except Exception as e:
		frappe.log_error(f"Segment reassignment failed: {e}", "Customer Segments")


def cleanup_notifications():
	"""Delete read user notifications older than 90 days."""
	cutoff = add_to_date(now_datetime(), days=-90)
	old = frappe.get_all(
		"User Notification",
		filters={"is_read": 1, "creation": ["<", cutoff]},
		pluck="name",
	)
	for name in old:
		frappe.delete_doc("User Notification", name, ignore_permissions=True)
	if old:
		frappe.db.commit()


def cleanup_analytics():
	"""Delete analytics events older than 180 days."""
	cutoff = add_to_date(now_datetime(), days=-180)
	old = frappe.get_all(
		"Analytics Event",
		filters={"event_timestamp": ["<", cutoff]},
		pluck="name",
		limit_page_length=5000,
	)
	for name in old:
		frappe.delete_doc("Analytics Event", name, ignore_permissions=True)
	if old:
		frappe.db.commit()
