# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Analytics event tracking and reporting APIs."""

import frappe
import json
from frappe.utils import now_datetime


@frappe.whitelist(allow_guest=True)
def track_event(event_name, session_id=None, reference_doctype=None, reference_name=None,
	page_url=None, event_data=None):
	"""Track an analytics event. Guest-accessible."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_analytics", 1):
		return {"message": "Analytics disabled"}

	valid_events = [
		"page_view", "add_to_cart", "remove_from_cart", "begin_checkout",
		"purchase", "search", "product_view", "add_to_wishlist",
		"apply_coupon", "sign_up",
	]
	if event_name not in valid_events:
		frappe.throw(f"Invalid event name: {event_name}")

	user = frappe.session.user if frappe.session.user != "Guest" else None

	doc = frappe.new_doc("Analytics Event")
	doc.event_name = event_name
	doc.user = user
	doc.session_id = session_id
	doc.event_timestamp = now_datetime()
	doc.reference_doctype = reference_doctype
	doc.reference_name = reference_name
	doc.page_url = page_url

	if event_data:
		doc.event_data_json = json.dumps(event_data) if isinstance(event_data, dict) else str(event_data)

	# Capture request metadata if available
	try:
		doc.user_agent = (frappe.request.headers.get("User-Agent", "") or "")[:500] if frappe.request else None
		doc.ip_address = frappe.local.request_ip if hasattr(frappe.local, "request_ip") else None
	except Exception:
		pass

	doc.insert(ignore_permissions=True)
	return {"message": "Event tracked", "event": doc.name}


@frappe.whitelist()
def get_event_summary(period="30d", event_name=None):
	"""Get analytics event summary. Admin-only."""
	if "Store Admin" not in frappe.get_roles() and "Administrator" != frappe.session.user:
		frappe.throw("Insufficient permissions.", frappe.PermissionError)

	from frappe.utils import add_days

	days_map = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
	days = days_map.get(period, 30)
	cutoff = add_days(now_datetime(), -days)

	conditions = "event_timestamp >= %(cutoff)s"
	values = {"cutoff": cutoff}

	if event_name:
		conditions += " AND event_name = %(event_name)s"
		values["event_name"] = event_name

	# Event counts by type
	event_counts = frappe.db.sql(f"""
		SELECT event_name, COUNT(*) as count
		FROM `tabAnalytics Event`
		WHERE {conditions}
		GROUP BY event_name
		ORDER BY count DESC
	""", values, as_dict=True)

	# Daily trend
	daily_trend = frappe.db.sql(f"""
		SELECT DATE(event_timestamp) as date, COUNT(*) as count
		FROM `tabAnalytics Event`
		WHERE {conditions}
		GROUP BY DATE(event_timestamp)
		ORDER BY date ASC
	""", values, as_dict=True)

	# Unique users
	unique_users = frappe.db.sql(f"""
		SELECT COUNT(DISTINCT user) as count
		FROM `tabAnalytics Event`
		WHERE {conditions} AND user IS NOT NULL
	""", values)[0][0]

	total_events = sum(e.count for e in event_counts)

	return {
		"period": period,
		"total_events": total_events,
		"unique_users": unique_users,
		"event_counts": event_counts,
		"daily_trend": daily_trend,
	}


@frappe.whitelist()
def get_conversion_funnel(period="30d"):
	"""Get e-commerce conversion funnel. Admin-only."""
	if "Store Admin" not in frappe.get_roles() and "Administrator" != frappe.session.user:
		frappe.throw("Insufficient permissions.", frappe.PermissionError)

	from frappe.utils import add_days

	days_map = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
	days = days_map.get(period, 30)
	cutoff = add_days(now_datetime(), -days)

	funnel_events = ["product_view", "add_to_cart", "begin_checkout", "purchase"]
	funnel = []

	for event in funnel_events:
		count = frappe.db.count("Analytics Event", {
			"event_name": event,
			"event_timestamp": [">=", cutoff],
		})
		funnel.append({"event": event, "count": count})

	return {"period": period, "funnel": funnel}


def _track_event_internal(event_name, reference_doctype=None, reference_name=None, user=None, event_data=None):
	"""Internal helper to track events without whitelist context."""
	from velora_verse.utils import get_store_settings

	try:
		settings = get_store_settings()
		if not getattr(settings, "enable_analytics", 1):
			return
	except Exception:
		return

	doc = frappe.new_doc("Analytics Event")
	doc.event_name = event_name
	doc.user = user or (frappe.session.user if frappe.session.user != "Guest" else None)
	doc.event_timestamp = now_datetime()
	doc.reference_doctype = reference_doctype
	doc.reference_name = reference_name
	if event_data:
		doc.event_data_json = json.dumps(event_data) if isinstance(event_data, dict) else str(event_data)
	doc.insert(ignore_permissions=True)
