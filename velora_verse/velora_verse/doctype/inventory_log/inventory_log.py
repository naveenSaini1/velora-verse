# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class InventoryLog(Document):
	def validate(self):
		if not self.created_by:
			self.created_by = frappe.session.user


def create_inventory_log(variant, change_type, quantity_change, previous_qty, new_qty, reference_type=None, reference_name=None):
	"""Create an inventory log entry. Used internally by order and stock management."""
	log = frappe.new_doc("Inventory Log")
	log.variant = variant
	log.change_type = change_type
	log.quantity_change = quantity_change
	log.previous_qty = previous_qty
	log.new_qty = new_qty
	log.reference_type = reference_type
	log.reference_name = reference_name
	log.created_by = frappe.session.user
	log.save(ignore_permissions=True)
	return log.name


@frappe.whitelist()
def restock_variant(variant, quantity):
	"""Add stock to a variant. Admin-only operation."""
	if not variant or not frappe.db.exists("Variants", variant):
		frappe.throw("Invalid variant.")

	quantity = int(quantity)
	if quantity < 1:
		frappe.throw("Restock quantity must be at least 1.")

	current_qty = frappe.db.get_value("Variants", variant, "quantity") or 0
	new_qty = current_qty + quantity

	frappe.db.set_value("Variants", variant, "quantity", new_qty)
	if new_qty > 0:
		frappe.db.set_value("Variants", variant, "is_stock", 1)

	log_name = create_inventory_log(
		variant=variant,
		change_type="Restock",
		quantity_change=quantity,
		previous_qty=current_qty,
		new_qty=new_qty,
		reference_type="Manual",
		reference_name=f"Restock by {frappe.session.user}",
	)

	# Update parent item stock status
	item_name = frappe.db.get_value("Variants", variant, "variant_name")
	if item_name:
		frappe.db.set_value("Items", item_name, "in_stock", 1)

	return {"message": "Stock updated", "previous_qty": current_qty, "new_qty": new_qty, "log": log_name}


@frappe.whitelist()
def adjust_stock(variant, new_quantity, reason=None):
	"""Set stock to a specific quantity. Admin-only operation."""
	if not variant or not frappe.db.exists("Variants", variant):
		frappe.throw("Invalid variant.")

	new_quantity = int(new_quantity)
	if new_quantity < 0:
		frappe.throw("Stock quantity cannot be negative.")

	current_qty = frappe.db.get_value("Variants", variant, "quantity") or 0
	change = new_quantity - current_qty

	frappe.db.set_value("Variants", variant, "quantity", new_quantity)
	frappe.db.set_value("Variants", variant, "is_stock", 1 if new_quantity > 0 else 0)

	log_name = create_inventory_log(
		variant=variant,
		change_type="Adjustment",
		quantity_change=change,
		previous_qty=current_qty,
		new_qty=new_quantity,
		reference_type="Manual",
		reference_name=reason or f"Adjustment by {frappe.session.user}",
	)

	# Update parent item stock status
	item_name = frappe.db.get_value("Variants", variant, "variant_name")
	if item_name:
		has_stock = frappe.db.count("Variants", {"variant_name": item_name, "is_stock": 1}) > 0
		frappe.db.set_value("Items", item_name, "in_stock", 1 if has_stock else 0)

	return {"message": "Stock adjusted", "previous_qty": current_qty, "new_qty": new_quantity, "log": log_name}
