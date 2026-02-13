# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{"fieldname": "item_name", "label": "Item", "fieldtype": "Data", "width": 200},
		{"fieldname": "variant", "label": "Variant", "fieldtype": "Link", "options": "Variants", "width": 250},
		{"fieldname": "current_stock", "label": "Current Stock", "fieldtype": "Int", "width": 110},
		{"fieldname": "total_sold", "label": "Total Sold", "fieldtype": "Int", "width": 100},
		{"fieldname": "last_restock", "label": "Last Restock", "fieldtype": "Datetime", "width": 160},
		{"fieldname": "status", "label": "Status", "fieldtype": "Data", "width": 100},
	]

	conditions = "1=1"
	values = {}

	if filters:
		if filters.get("stock_status") == "In Stock":
			conditions += " AND v.is_stock = 1"
		elif filters.get("stock_status") == "Out of Stock":
			conditions += " AND v.is_stock = 0"
		elif filters.get("stock_status") == "Low Stock":
			conditions += " AND v.quantity > 0 AND v.quantity <= 5"

	data = frappe.db.sql(f"""
		SELECT
			i.item_name,
			v.name as variant,
			v.quantity as current_stock,
			COALESCE(
				(SELECT ABS(SUM(il.quantity_change))
				 FROM `tabInventory Log` il
				 WHERE il.variant = v.name AND il.change_type = 'Sale'),
				0
			) as total_sold,
			(SELECT MAX(il2.creation)
			 FROM `tabInventory Log` il2
			 WHERE il2.variant = v.name AND il2.change_type = 'Restock'
			) as last_restock,
			CASE
				WHEN v.quantity = 0 THEN 'Out of Stock'
				WHEN v.quantity <= 5 THEN 'Low Stock'
				ELSE 'In Stock'
			END as status
		FROM `tabVariants` v
		LEFT JOIN `tabItems` i ON i.name = v.variant_name
		WHERE {conditions}
		ORDER BY v.quantity ASC, i.item_name ASC
	""", values, as_dict=True)

	return columns, data
