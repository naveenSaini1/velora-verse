# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Customer Segments APIs and helpers."""

import frappe
from frappe.utils import now_datetime, add_days, today


@frappe.whitelist()
def get_my_segments():
	"""Get the current user's customer segments."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	segments = frappe.db.sql("""
		SELECT cs.name, cs.segment_name, cs.discount_percentage, cs.loyalty_multiplier
		FROM `tabCustomer Segment` cs
		INNER JOIN `tabSegment Members` sm ON sm.parent = cs.name
		WHERE sm.user = %(user)s AND cs.is_active = 1
		ORDER BY cs.discount_percentage DESC
	""", {"user": user}, as_dict=True)

	return {"segments": segments}


def get_segment_discount(user):
	"""Get the best segment discount for a user. Returns percentage."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_customer_segments", 0):
		return 0

	result = frappe.db.sql("""
		SELECT MAX(cs.discount_percentage)
		FROM `tabCustomer Segment` cs
		INNER JOIN `tabSegment Members` sm ON sm.parent = cs.name
		WHERE sm.user = %s AND cs.is_active = 1
	""", user)

	return float(result[0][0] or 0) if result else 0


def get_segment_name_for_user(user):
	"""Get the best segment name for a user (highest discount)."""
	result = frappe.db.sql("""
		SELECT cs.segment_name
		FROM `tabCustomer Segment` cs
		INNER JOIN `tabSegment Members` sm ON sm.parent = cs.name
		WHERE sm.user = %s AND cs.is_active = 1
		ORDER BY cs.discount_percentage DESC
		LIMIT 1
	""", user, as_dict=True)

	return result[0].segment_name if result else None


def get_loyalty_multiplier(user):
	"""Get the best loyalty multiplier from user's segments."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_customer_segments", 0):
		return 1.0

	result = frappe.db.sql("""
		SELECT MAX(cs.loyalty_multiplier)
		FROM `tabCustomer Segment` cs
		INNER JOIN `tabSegment Members` sm ON sm.parent = cs.name
		WHERE sm.user = %s AND cs.is_active = 1
	""", user)

	return float(result[0][0] or 1.0) if result else 1.0


def reassign_customer_segments():
	"""Daily task: auto-assign users to segments based on rules."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_customer_segments", 0):
		return

	auto_segments = frappe.get_all(
		"Customer Segment",
		filters={"segment_type": "Automatic", "is_active": 1},
		fields=["name", "min_total_spent", "min_order_count",
			"min_avg_order_value", "days_since_last_order"],
		order_by="discount_percentage desc",
	)

	if not auto_segments:
		return

	# Get all customers
	customers = frappe.get_all(
		"User",
		filters={"user_type": "Website User", "enabled": 1},
		pluck="name",
	)

	for user in customers:
		# Get user's order stats
		stats = frappe.db.sql("""
			SELECT
				COALESCE(SUM(total), 0) as total_spent,
				COUNT(*) as order_count,
				COALESCE(AVG(total), 0) as avg_order_value,
				MAX(order_date) as last_order_date
			FROM `tabOrder`
			WHERE user = %s AND docstatus = 1 AND payment_status = 'Paid'
		""", user, as_dict=True)[0]

		for segment in auto_segments:
			matches = True

			if segment.min_total_spent and stats.total_spent < segment.min_total_spent:
				matches = False
			if segment.min_order_count and stats.order_count < segment.min_order_count:
				matches = False
			if segment.min_avg_order_value and stats.avg_order_value < segment.min_avg_order_value:
				matches = False
			if segment.days_since_last_order and stats.last_order_date:
				days_ago = (now_datetime() - stats.last_order_date).days
				if days_ago > segment.days_since_last_order:
					matches = False

			# Check if already a member
			is_member = frappe.db.exists(
				"Segment Members",
				{"parent": segment.name, "user": user},
			)

			if matches and not is_member:
				seg_doc = frappe.get_doc("Customer Segment", segment.name)
				seg_doc.append("segment_members", {
					"user": user,
					"assigned_on": today(),
				})
				seg_doc.save(ignore_permissions=True)
			elif not matches and is_member:
				# Remove from segment
				frappe.db.sql("""
					DELETE FROM `tabSegment Members`
					WHERE parent = %s AND user = %s
				""", (segment.name, user))

	frappe.db.commit()
