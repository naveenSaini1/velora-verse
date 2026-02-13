# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Loyalty Points system APIs and helpers."""

import frappe
from frappe.utils import now_datetime, add_days, getdate, today


@frappe.whitelist()
def get_loyalty_balance():
	"""Get the current user's loyalty points balance."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view loyalty points.")

	available_points = _get_balance(user)
	currency_value = _points_to_currency(available_points)

	# Total lifetime earned
	total_earned = frappe.db.sql("""
		SELECT COALESCE(SUM(points_change), 0)
		FROM `tabLoyalty Points Ledger`
		WHERE user = %s AND points_change > 0 AND transaction_type = 'Earn'
	""", user)[0][0]

	return {
		"available_points": int(available_points),
		"total_points": int(total_earned),
		"currency_value": currency_value,
		"pending_points": 0,
	}


@frappe.whitelist()
def get_loyalty_history(page=1, limit=20):
	"""Get the current user's loyalty points transaction history."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view loyalty history.")

	page = max(1, int(page))
	limit = min(50, max(1, int(limit)))
	offset = (page - 1) * limit

	total_count = frappe.db.count("Loyalty Points Ledger", {"user": user})

	entries = frappe.get_all(
		"Loyalty Points Ledger",
		filters={"user": user},
		fields=[
			"name", "points_change as points", "transaction_type", "running_balance",
			"reference_doctype", "reference_name", "expiry_date",
			"is_expired", "creation",
		],
		order_by="creation desc",
		limit_page_length=limit,
		limit_start=offset,
	)

	return {
		"entries": entries,
		"balance": _get_balance(user),
		"total_count": total_count,
		"page": page,
		"limit": limit,
		"total_pages": (total_count + limit - 1) // limit if total_count else 0,
	}


@frappe.whitelist()
def preview_loyalty_redemption(points_to_redeem):
	"""Preview how many points can be redeemed and the discount amount."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return {"redeemable": False, "message": "Loyalty points are not enabled."}

	points_to_redeem = int(points_to_redeem)
	balance = _get_balance(user)

	min_points = getattr(settings, "min_points_to_redeem", 100) or 100
	max_points = getattr(settings, "max_points_per_order", 0) or 0

	if balance < min_points:
		return {
			"redeemable": False,
			"message": f"Minimum {min_points} points required to redeem. You have {balance}.",
		}

	# Cap at balance
	redeemable = min(points_to_redeem, balance)

	# Cap at max per order
	if max_points > 0:
		redeemable = min(redeemable, max_points)

	discount = _points_to_currency(redeemable)

	return {
		"redeemable": True,
		"points_to_redeem": redeemable,
		"discount_amount": discount,
		"remaining_balance": balance - redeemable,
	}


# --- Internal helpers ---

def earn_points_for_order(order_name, user, order_total):
	"""Award loyalty points for a completed order."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return 0

	# Get segment multiplier
	multiplier = 1.0
	try:
		from velora_verse.api.segments import get_loyalty_multiplier
		multiplier = get_loyalty_multiplier(user)
	except Exception:
		frappe.log_error(title=f"Loyalty Segment Multiplier Failed: {user}", message=frappe.get_traceback())

	total_points = 0

	# Earn Per Rupee rule
	per_rupee_rules = frappe.get_all(
		"Loyalty Points Rule",
		filters={"rule_type": "Earn Per Rupee", "is_active": 1},
		fields=["points_awarded", "min_order_value", "multiplier"],
	)
	for rule in per_rupee_rules:
		if order_total >= (rule.min_order_value or 0):
			rule_multiplier = rule.multiplier or 1.0
			points = int(order_total * rule.points_awarded / 100 * rule_multiplier * multiplier)
			total_points += points

	# Per Order rule
	per_order_rules = frappe.get_all(
		"Loyalty Points Rule",
		filters={"rule_type": "Per Order", "is_active": 1},
		fields=["points_awarded", "min_order_value"],
	)
	for rule in per_order_rules:
		if order_total >= (rule.min_order_value or 0):
			total_points += int(rule.points_awarded * multiplier)

	if total_points > 0:
		_add_ledger_entry(
			user=user,
			points_change=total_points,
			transaction_type="Earn",
			reference_doctype="Order",
			reference_name=order_name,
		)

	return total_points


def redeem_points_for_order(order_name, user, points_to_redeem):
	"""Redeem loyalty points for an order. Returns discount amount.
	Uses SELECT ... FOR UPDATE to prevent concurrent redemptions."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return 0

	points_to_redeem = int(points_to_redeem)

	min_points = getattr(settings, "min_points_to_redeem", 100) or 100
	max_points = getattr(settings, "max_points_per_order", 0) or 0

	# Lock all ledger rows for this user and compute balance under lock
	locked_balance = _lock_user_balance(user)

	if points_to_redeem <= 0 or locked_balance < min_points:
		return 0

	redeemable = min(points_to_redeem, locked_balance)
	if max_points > 0:
		redeemable = min(redeemable, max_points)

	discount = _points_to_currency(redeemable)

	_add_ledger_entry(
		user=user,
		points_change=-redeemable,
		transaction_type="Redeem",
		reference_doctype="Order",
		reference_name=order_name,
		locked_balance=locked_balance,
	)

	return discount


def refund_points_for_order(order_name, user):
	"""Refund redeemed points when an order is cancelled."""
	# Find the redemption entry for this order
	entries = frappe.get_all(
		"Loyalty Points Ledger",
		filters={
			"user": user,
			"transaction_type": "Redeem",
			"reference_doctype": "Order",
			"reference_name": order_name,
		},
		fields=["points_change"],
	)

	total_refund = 0
	for entry in entries:
		refund_points = abs(entry.points_change)
		total_refund += refund_points

	if total_refund > 0:
		_add_ledger_entry(
			user=user,
			points_change=total_refund,
			transaction_type="Refund",
			reference_doctype="Order",
			reference_name=order_name,
		)

	# Also reverse earned points
	earned = frappe.get_all(
		"Loyalty Points Ledger",
		filters={
			"user": user,
			"transaction_type": "Earn",
			"reference_doctype": "Order",
			"reference_name": order_name,
		},
		fields=["points_change"],
	)
	for entry in earned:
		_add_ledger_entry(
			user=user,
			points_change=-entry.points_change,
			transaction_type="Adjustment",
			reference_doctype="Order",
			reference_name=order_name,
		)

	return total_refund


def award_signup_bonus(user):
	"""Award signup bonus points."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return 0

	rules = frappe.get_all(
		"Loyalty Points Rule",
		filters={"rule_type": "Signup", "is_active": 1},
		fields=["points_awarded"],
	)

	total = 0
	for rule in rules:
		total += rule.points_awarded
		_add_ledger_entry(
			user=user,
			points_change=rule.points_awarded,
			transaction_type="Earn",
			reference_doctype="User",
			reference_name=user,
		)

	return total


def award_review_bonus(user, review_name):
	"""Award bonus points for writing a review."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return 0

	rules = frappe.get_all(
		"Loyalty Points Rule",
		filters={"rule_type": "Review", "is_active": 1},
		fields=["points_awarded"],
	)

	total = 0
	for rule in rules:
		total += rule.points_awarded
		_add_ledger_entry(
			user=user,
			points_change=rule.points_awarded,
			transaction_type="Earn",
			reference_doctype="Review",
			reference_name=review_name,
		)

	return total


def expire_loyalty_points():
	"""Daily task: expire points past their expiry date."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_loyalty_points", 0):
		return

	expired_entries = frappe.get_all(
		"Loyalty Points Ledger",
		filters={
			"transaction_type": "Earn",
			"is_expired": 0,
			"expiry_date": ["<", today()],
			"points_change": [">", 0],
		},
		fields=["name", "user", "points_change"],
	)

	for entry in expired_entries:
		frappe.db.set_value("Loyalty Points Ledger", entry.name, "is_expired", 1)
		_add_ledger_entry(
			user=entry.user,
			points_change=-entry.points_change,
			transaction_type="Expiry",
			reference_doctype="Loyalty Points Ledger",
			reference_name=entry.name,
		)

	if expired_entries:
		frappe.db.commit()


def _get_balance(user):
	"""Get current points balance for a user."""
	result = frappe.db.sql("""
		SELECT COALESCE(SUM(points_change), 0)
		FROM `tabLoyalty Points Ledger`
		WHERE user = %s
	""", user)
	return int(result[0][0]) if result else 0


def _lock_user_balance(user):
	"""Lock all ledger rows for a user (SELECT ... FOR UPDATE) and return balance.
	Must be called within a transaction. Serializes concurrent redemptions."""
	result = frappe.db.sql("""
		SELECT COALESCE(SUM(points_change), 0)
		FROM `tabLoyalty Points Ledger`
		WHERE user = %s
		FOR UPDATE
	""", user)
	return int(result[0][0]) if result else 0


def _points_to_currency(points):
	"""Convert points to currency amount."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	ratio = getattr(settings, "points_to_currency_ratio", 10) or 10
	return round(points / ratio, 2)


def _add_ledger_entry(user, points_change, transaction_type, reference_doctype=None,
	reference_name=None, locked_balance=None):
	"""Create a loyalty points ledger entry.
	If locked_balance is provided (from _lock_user_balance), uses it instead of re-querying."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	expiry_days = getattr(settings, "points_expiry_days", 365) or 365

	if locked_balance is not None:
		balance = locked_balance + points_change
	else:
		balance = _get_balance(user) + points_change

	doc = frappe.new_doc("Loyalty Points Ledger")
	doc.user = user
	doc.points_change = points_change
	doc.transaction_type = transaction_type
	doc.running_balance = balance
	doc.reference_doctype = reference_doctype
	doc.reference_name = reference_name
	if transaction_type == "Earn" and points_change > 0:
		doc.expiry_date = add_days(today(), expiry_days)
	doc.insert(ignore_permissions=True)
	return doc.name
