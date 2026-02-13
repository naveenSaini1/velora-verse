# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{"fieldname": "category", "label": "Category", "fieldtype": "Link", "options": "Category", "width": 200},
		{"fieldname": "items_sold", "label": "Items Sold", "fieldtype": "Int", "width": 110},
		{"fieldname": "revenue", "label": "Revenue", "fieldtype": "Currency", "width": 130},
		{"fieldname": "avg_price", "label": "Avg Price", "fieldtype": "Currency", "width": 110},
		{"fieldname": "order_count", "label": "Orders", "fieldtype": "Int", "width": 90},
	]

	conditions = "o.docstatus = 1"
	values = {}

	if filters:
		if filters.get("from_date"):
			conditions += " AND DATE(o.order_date) >= %(from_date)s"
			values["from_date"] = filters["from_date"]
		if filters.get("to_date"):
			conditions += " AND DATE(o.order_date) <= %(to_date)s"
			values["to_date"] = filters["to_date"]

	data = frappe.db.sql(f"""
		SELECT
			ic.category,
			SUM(oi.quantity) as items_sold,
			SUM(oi.amount) as revenue,
			AVG(oi.rate) as avg_price,
			COUNT(DISTINCT o.name) as order_count
		FROM `tabOrder Items` oi
		INNER JOIN `tabOrder` o ON o.name = oi.parent
		INNER JOIN `tabVariants` v ON v.name = oi.variant
		INNER JOIN `tabItem Category` ic ON ic.parent = v.variant_name
		WHERE {conditions}
		GROUP BY ic.category
		ORDER BY revenue DESC
	""", values, as_dict=True)

	return columns, data
