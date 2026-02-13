# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{"fieldname": "order_date", "label": "Date", "fieldtype": "Date", "width": 110},
		{"fieldname": "order", "label": "Order", "fieldtype": "Link", "options": "Order", "width": 130},
		{"fieldname": "customer", "label": "Customer", "fieldtype": "Data", "width": 180},
		{"fieldname": "subtotal", "label": "Subtotal", "fieldtype": "Currency", "width": 110},
		{"fieldname": "discount", "label": "Discount", "fieldtype": "Currency", "width": 100},
		{"fieldname": "tax_amount", "label": "Tax", "fieldtype": "Currency", "width": 100},
		{"fieldname": "shipping", "label": "Shipping", "fieldtype": "Currency", "width": 100},
		{"fieldname": "total", "label": "Total", "fieldtype": "Currency", "width": 110},
		{"fieldname": "payment_status", "label": "Payment", "fieldtype": "Data", "width": 100},
		{"fieldname": "payment_method", "label": "Method", "fieldtype": "Data", "width": 100},
		{"fieldname": "status", "label": "Status", "fieldtype": "Data", "width": 100},
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
		if filters.get("payment_status"):
			conditions += " AND o.payment_status = %(payment_status)s"
			values["payment_status"] = filters["payment_status"]
		if filters.get("status"):
			conditions += " AND o.status = %(status)s"
			values["status"] = filters["status"]

	data = frappe.db.sql(f"""
		SELECT
			DATE(o.order_date) as order_date,
			o.name as `order`,
			CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) as customer,
			o.subtotal,
			o.discount_amount as discount,
			o.tax_amount,
			o.shipping_charge as shipping,
			o.total,
			o.payment_status,
			o.payment_method,
			o.status
		FROM `tabOrder` o
		LEFT JOIN `tabUser` u ON u.name = o.user
		WHERE {conditions}
		ORDER BY o.order_date DESC
	""", values, as_dict=True)

	return columns, data


def get_report_filters():
	return [
		{"fieldname": "from_date", "label": "From Date", "fieldtype": "Date"},
		{"fieldname": "to_date", "label": "To Date", "fieldtype": "Date"},
		{"fieldname": "payment_status", "label": "Payment Status", "fieldtype": "Select",
		 "options": "\nUnpaid\nPaid\nRefunded\nPartially Refunded"},
		{"fieldname": "status", "label": "Order Status", "fieldtype": "Select",
		 "options": "\nPending\nConfirmed\nProcessing\nShipped\nDelivered\nCancelled\nReturned"},
	]
