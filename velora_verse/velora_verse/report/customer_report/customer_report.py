# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{"fieldname": "customer", "label": "Customer", "fieldtype": "Data", "width": 200},
		{"fieldname": "email", "label": "Email", "fieldtype": "Data", "width": 200},
		{"fieldname": "total_orders", "label": "Total Orders", "fieldtype": "Int", "width": 110},
		{"fieldname": "total_spent", "label": "Total Spent", "fieldtype": "Currency", "width": 120},
		{"fieldname": "avg_order_value", "label": "Avg Order Value", "fieldtype": "Currency", "width": 130},
		{"fieldname": "last_order", "label": "Last Order", "fieldtype": "Date", "width": 110},
		{"fieldname": "member_since", "label": "Member Since", "fieldtype": "Date", "width": 110},
	]

	data = frappe.db.sql("""
		SELECT
			CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) as customer,
			u.name as email,
			COUNT(o.name) as total_orders,
			COALESCE(SUM(o.total), 0) as total_spent,
			COALESCE(AVG(o.total), 0) as avg_order_value,
			MAX(DATE(o.order_date)) as last_order,
			DATE(u.creation) as member_since
		FROM `tabUser` u
		INNER JOIN `tabOrder` o ON o.user = u.name AND o.docstatus = 1
		WHERE u.user_type = 'Website User'
		GROUP BY u.name
		ORDER BY total_spent DESC
	""", as_dict=True)

	return columns, data
