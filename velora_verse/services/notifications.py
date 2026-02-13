# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Email notification system for order lifecycle and customer events."""

import frappe
from frappe.utils import fmt_money


def send_order_email(order_name, template_name, subject):
	"""
	Render an order email template and send it.

	Args:
		order_name: Order document name
		template_name: Template file name (without .html)
		subject: Email subject line
	"""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	order = frappe.get_doc("Order", order_name)
	user_email = order.user
	user_name = frappe.db.get_value("User", user_email, "full_name") or user_email

	# Build items list for template
	items = []
	for row in order.order_items:
		items.append({
			"variant_title": row.variant_title or row.variant,
			"item_name": row.item_name or "",
			"quantity": row.quantity,
			"rate": fmt_money(row.rate, currency="INR"),
			"amount": fmt_money(row.amount, currency="INR"),
		})

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"customer_name": user_name,
		"order_name": order.name,
		"order_date": frappe.utils.format_datetime(order.order_date, "dd MMM yyyy, hh:mm a"),
		"status": order.status,
		"payment_status": order.payment_status,
		"payment_method": order.payment_method or "",
		"items": items,
		"subtotal": fmt_money(order.subtotal, currency="INR"),
		"discount_amount": fmt_money(order.discount_amount, currency="INR") if order.discount_amount else None,
		"tax_amount": fmt_money(order.tax_amount, currency="INR") if order.tax_amount else None,
		"tax_rate": order.tax_rate,
		"shipping_charge": fmt_money(order.shipping_charge, currency="INR") if order.shipping_charge else None,
		"total": fmt_money(order.total, currency="INR"),
		"shipping_address": order.shipping_address_display or "",
		"tracking_number": order.tracking_number or "",
		"tracking_url": order.tracking_url or "",
		"delivered_on": frappe.utils.format_datetime(order.delivered_on, "dd MMM yyyy") if order.delivered_on else "",
		"cancelled_reason": order.cancelled_reason or "",
		"currency_symbol": settings.currency_symbol or "Rs.",
	}

	full_subject = f"{settings.store_name or 'Velora Verse'} - {subject} - {order.name}"

	recipients = [user_email]
	cc = []
	if settings.order_email_cc:
		cc.append(settings.order_email_cc)

	_send_email(recipients, full_subject, template_name, args, cc=cc)


def send_welcome_email(email, full_name):
	"""Send welcome email to newly registered customer."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"customer_name": full_name,
		"email": email,
	}

	subject = f"Welcome to {settings.store_name or 'Velora Verse'}!"
	_send_email([email], subject, "welcome", args)


def send_return_email(return_request_name, template_name, subject):
	"""Send return/refund related emails."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	ret = frappe.get_doc("Return Request", return_request_name)
	user_email = ret.user
	user_name = frappe.db.get_value("User", user_email, "full_name") or user_email

	items = []
	for row in ret.return_items:
		items.append({
			"variant_title": row.variant_title or row.variant,
			"quantity": row.quantity,
			"rate": fmt_money(row.rate, currency="INR"),
			"amount": fmt_money(row.amount, currency="INR"),
		})

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"customer_name": user_name,
		"return_name": ret.name,
		"order_name": ret.order,
		"return_type": ret.return_type,
		"reason": ret.reason,
		"reason_detail": ret.reason_detail or "",
		"status": ret.status,
		"items": items,
		"refund_amount": fmt_money(ret.refund_amount, currency="INR") if ret.refund_amount else None,
		"refund_method": ret.refund_method or "",
		"admin_notes": ret.admin_notes or "",
		"currency_symbol": settings.currency_symbol or "Rs.",
	}

	full_subject = f"{settings.store_name or 'Velora Verse'} - {subject} - {ret.name}"

	recipients = [user_email]
	cc = []
	if settings.order_email_cc:
		cc.append(settings.order_email_cc)

	_send_email(recipients, full_subject, template_name, args, cc=cc)


def send_low_stock_alert(email, low_stock_variants, out_of_stock_variants, threshold):
	"""Send low stock alert to admin."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"threshold": threshold,
		"low_stock": low_stock_variants,
		"out_of_stock": out_of_stock_variants,
		"low_stock_count": len(low_stock_variants),
		"oos_count": len(out_of_stock_variants),
	}

	subject = f"{settings.store_name or 'Velora Verse'} - Low Stock Alert"
	_send_email([email], subject, "low_stock_alert", args)


def send_back_in_stock_notification(email, variant_title, variant_name):
	"""Send back-in-stock notification to subscriber."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"variant_title": variant_title,
		"variant_name": variant_name,
	}

	subject = f"{variant_title} is back in stock!"
	_send_email([email], subject, "back_in_stock", args)


def send_abandoned_cart_email(user, cart_items, total):
	"""Send abandoned cart reminder email to customer."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	user_name = frappe.db.get_value("User", user, "full_name") or user

	items = []
	for item in cart_items:
		items.append({
			"variant_title": item.get("variant_title") or item.get("variant", ""),
			"quantity": item.get("quantity", 1),
			"rate": fmt_money(item.get("rate", 0), currency="INR"),
		})

	args = {
		"store_name": settings.store_name or "Velora Verse",
		"customer_name": user_name,
		"items": items,
		"total": fmt_money(total, currency="INR"),
	}

	subject = f"You left items in your cart at {settings.store_name or 'Velora Verse'}!"
	_send_email([user], subject, "abandoned_cart", args)


def _send_email(recipients, subject, template_name, args, cc=None):
	"""Send email using a Jinja template from the emails directory."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()

	# Check if email notifications are enabled for this type
	template_settings_map = {
		"order_confirmation": "send_order_confirmation",
		"order_shipped": "send_shipping_notification",
		"order_delivered": "send_delivery_confirmation",
	}

	setting_key = template_settings_map.get(template_name)
	if setting_key and not getattr(settings, setting_key, True):
		return

	template_path = f"velora_verse/templates/emails/{template_name}.html"

	try:
		message = frappe.render_template(
			frappe.get_app_path("velora_verse", "templates", "emails", f"{template_name}.html"),
			args,
			is_path=True,
		)
	except Exception:
		# Fallback: build a simple text email
		message = f"<h3>{subject}</h3><p>Order: {args.get('order_name', '')}</p>"

	frappe.sendmail(
		recipients=recipients,
		cc=cc,
		subject=subject,
		message=message,
		now=True,
	)
