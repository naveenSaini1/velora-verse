# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Admin dashboard statistics and analytics APIs."""

import frappe
from frappe.utils import now_datetime, add_to_date, getdate, flt


@frappe.whitelist()
def get_dashboard_stats(period="monthly"):
	"""
	Get dashboard statistics for the admin.

	Args:
		period: 'daily', 'weekly', 'monthly', 'yearly'
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	now = now_datetime()
	period_start = _get_period_start(now, period)

	# Revenue
	revenue = frappe.db.sql("""
		SELECT COALESCE(SUM(total), 0) FROM `tabOrder`
		WHERE docstatus = 1 AND payment_status = 'Paid'
		AND order_date >= %s
	""", period_start)[0][0]

	# Order count
	order_count = frappe.db.count("Order", {
		"docstatus": 1,
		"order_date": [">=", period_start],
	})

	# Average order value
	avg_order_value = flt(revenue) / order_count if order_count else 0

	# New customers (users created in period)
	new_customers = frappe.db.sql("""
		SELECT COUNT(*) FROM `tabUser`
		WHERE user_type = 'Website User'
		AND creation >= %s
	""", period_start)[0][0]

	# Orders by status
	orders_by_status = frappe.db.sql("""
		SELECT status, COUNT(*) as count
		FROM `tabOrder`
		WHERE docstatus = 1 AND order_date >= %s
		GROUP BY status
		ORDER BY count DESC
	""", period_start, as_dict=True)

	# Top 10 products by revenue
	top_products = frappe.db.sql("""
		SELECT oi.item_name, SUM(oi.amount) as revenue,
			SUM(oi.quantity) as total_qty
		FROM `tabOrder Items` oi
		INNER JOIN `tabOrder` o ON o.name = oi.parent
		WHERE o.docstatus = 1 AND o.payment_status = 'Paid'
		AND o.order_date >= %s
		GROUP BY oi.item_name
		ORDER BY revenue DESC
		LIMIT 10
	""", period_start, as_dict=True)

	# Payment method breakdown
	payment_breakdown = frappe.db.sql("""
		SELECT payment_method, COUNT(*) as count,
			SUM(total) as total_amount
		FROM `tabOrder`
		WHERE docstatus = 1 AND payment_status = 'Paid'
		AND order_date >= %s
		GROUP BY payment_method
		ORDER BY total_amount DESC
	""", period_start, as_dict=True)

	# Low stock variants (top 10)
	low_stock = frappe.db.sql("""
		SELECT v.name, v.title, v.quantity, i.item_name
		FROM `tabVariants` v
		LEFT JOIN `tabItems` i ON i.name = v.variant_name
		WHERE v.quantity <= 5 AND v.quantity > 0
		AND i.status = 'Active'
		ORDER BY v.quantity ASC
		LIMIT 10
	""", as_dict=True)

	# Pending returns
	pending_returns = frappe.db.count("Return Request", {
		"status": "Pending",
		"docstatus": ["!=", 2],
	})

	# Active promotions
	active_promotions = frappe.db.count("Promotion", {"is_active": 1})

	# Gift card stats
	gift_card_stats = frappe.db.sql("""
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
			COALESCE(SUM(original_amount), 0) as total_issued,
			COALESCE(SUM(original_amount - current_balance), 0) as total_redeemed
		FROM `tabGift Card`
	""", as_dict=True)[0]

	# Loyalty points summary
	loyalty_stats = frappe.db.sql("""
		SELECT
			COALESCE(SUM(CASE WHEN transaction_type = 'Earn' THEN points_change ELSE 0 END), 0) as total_earned,
			COALESCE(SUM(CASE WHEN transaction_type = 'Redeem' THEN ABS(points_change) ELSE 0 END), 0) as total_redeemed
		FROM `tabLoyalty Points Ledger`
	""", as_dict=True)[0]

	# Customer segment breakdown
	segments = frappe.db.sql("""
		SELECT cs.segment_name, cs.discount_percentage,
			(SELECT COUNT(*) FROM `tabSegment Members` sm WHERE sm.parent = cs.name) as member_count
		FROM `tabCustomer Segment` cs
		WHERE cs.is_active = 1
		ORDER BY cs.discount_percentage DESC
	""", as_dict=True)

	return {
		"revenue": flt(revenue, 2),
		"order_count": order_count,
		"avg_order_value": flt(avg_order_value, 2),
		"new_customers": new_customers,
		"orders_by_status": orders_by_status,
		"top_products": top_products,
		"payment_breakdown": payment_breakdown,
		"low_stock_variants": low_stock,
		"pending_returns": pending_returns,
		"active_promotions": active_promotions,
		"gift_card_stats": {
			"total": gift_card_stats.total or 0,
			"active": gift_card_stats.active or 0,
			"total_issued": flt(gift_card_stats.total_issued, 2),
			"total_redeemed": flt(gift_card_stats.total_redeemed, 2),
		},
		"loyalty_stats": {
			"total_earned": int(loyalty_stats.total_earned or 0),
			"total_redeemed": int(loyalty_stats.total_redeemed or 0),
		},
		"customer_segments": segments,
		"period": period,
	}


@frappe.whitelist()
def get_revenue_chart(period="monthly", group_by="day"):
	"""
	Get time-series revenue data for charts.

	Args:
		period: 'weekly', 'monthly', 'quarterly', 'yearly'
		group_by: 'day', 'week', 'month'
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	now = now_datetime()
	period_start = _get_period_start(now, period)

	if group_by == "day":
		date_format = "%Y-%m-%d"
	elif group_by == "week":
		date_format = "%Y-%u"
	else:
		date_format = "%Y-%m"

	data = frappe.db.sql("""
		SELECT DATE_FORMAT(order_date, %s) as period_label,
			COUNT(*) as order_count,
			COALESCE(SUM(total), 0) as revenue
		FROM `tabOrder`
		WHERE docstatus = 1 AND payment_status = 'Paid'
		AND order_date >= %s
		GROUP BY period_label
		ORDER BY period_label ASC
	""", (date_format, period_start), as_dict=True)

	return {
		"labels": [d.period_label for d in data],
		"revenue": [flt(d.revenue, 2) for d in data],
		"order_count": [d.order_count for d in data],
	}


@frappe.whitelist()
def get_order_funnel():
	"""Get cart-to-order-to-paid-to-delivered conversion funnel."""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	# Active carts (with items)
	active_carts = frappe.db.sql("""
		SELECT COUNT(DISTINCT c.name)
		FROM `tabCart` c
		INNER JOIN `tabCart Items` ci ON ci.parent = c.name
	""")[0][0]

	# Total orders
	total_orders = frappe.db.count("Order", {"docstatus": 1})

	# Paid orders
	paid_orders = frappe.db.count("Order", {"docstatus": 1, "payment_status": "Paid"})

	# Delivered orders
	delivered_orders = frappe.db.count("Order", {"docstatus": 1, "status": "Delivered"})

	return {
		"funnel": [
			{"stage": "Active Carts", "count": active_carts},
			{"stage": "Orders Placed", "count": total_orders},
			{"stage": "Paid", "count": paid_orders},
			{"stage": "Delivered", "count": delivered_orders},
		]
	}


def _get_period_start(now, period):
	"""Get the start datetime for a given period."""
	if period == "daily":
		return now.replace(hour=0, minute=0, second=0, microsecond=0)
	elif period == "weekly":
		return add_to_date(now, days=-7)
	elif period == "monthly":
		return add_to_date(now, months=-1)
	elif period == "quarterly":
		return add_to_date(now, months=-3)
	elif period == "yearly":
		return add_to_date(now, years=-1)
	else:
		return add_to_date(now, months=-1)
