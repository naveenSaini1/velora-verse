# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Bulk import/export operations for products, stock, and prices."""

import csv
import io

import frappe
from frappe.utils import cint, flt


@frappe.whitelist()
def export_products(filters=None, file_format="csv"):
	"""
	Export products and variants as CSV.

	Returns file URL for download.
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	data = frappe.db.sql("""
		SELECT
			i.name as item_id, i.item_name, i.slug, i.type as item_type,
			i.base_price, i.sku as item_sku, i.status, i.in_stock, i.is_featured,
			v.name as variant_id, v.title as variant_title, v.price as variant_price,
			v.quantity as stock_qty, v.is_stock, v.weight, v.barcode
		FROM `tabItems` i
		LEFT JOIN `tabVariants` v ON v.variant_name = i.name
		ORDER BY i.item_name, v.title
	""", as_dict=True)

	output = io.StringIO()
	writer = csv.DictWriter(output, fieldnames=[
		"item_id", "item_name", "slug", "item_type", "base_price", "item_sku",
		"status", "in_stock", "is_featured",
		"variant_id", "variant_title", "variant_price", "stock_qty", "is_stock",
		"weight", "barcode",
	])
	writer.writeheader()
	for row in data:
		writer.writerow(row)

	content = output.getvalue()
	file_name = f"products_export_{frappe.utils.now_datetime().strftime('%Y%m%d_%H%M%S')}.csv"

	file_doc = frappe.get_doc({
		"doctype": "File",
		"file_name": file_name,
		"content": content,
		"is_private": 1,
	})
	file_doc.save(ignore_permissions=True)

	return {"file_url": file_doc.file_url, "file_name": file_name, "row_count": len(data)}


@frappe.whitelist()
def import_products(file_url):
	"""
	Import products from a CSV file (background job).

	CSV columns: item_name, item_type, base_price, sku, description, status
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	frappe.enqueue(
		_process_product_import,
		file_url=file_url,
		queue="default",
		timeout=600,
	)

	return {"message": "Import started. You'll be notified when it's complete."}


def _process_product_import(file_url):
	"""Process product import CSV in background."""
	file_doc = frappe.get_doc("File", {"file_url": file_url})
	content = file_doc.get_content()

	if isinstance(content, bytes):
		content = content.decode("utf-8")

	reader = csv.DictReader(io.StringIO(content))
	created = 0
	updated = 0
	errors = []

	for i, row in enumerate(reader, start=2):
		try:
			item_name = row.get("item_name", "").strip()
			if not item_name:
				continue

			existing = frappe.db.get_value("Items", {"item_name": item_name}, "name")
			if existing:
				frappe.db.set_value("Items", existing, {
					"base_price": flt(row.get("base_price", 0)),
					"status": row.get("status", "Active"),
				})
				updated += 1
			else:
				doc = frappe.get_doc({
					"doctype": "Items",
					"item_name": item_name,
					"type": row.get("item_type", ""),
					"base_price": flt(row.get("base_price", 0)),
					"sku": row.get("sku", ""),
					"description": row.get("description", ""),
					"status": row.get("status", "Active"),
				})
				doc.insert(ignore_permissions=True)
				created += 1

			if (created + updated) % 50 == 0:
				frappe.db.commit()

		except Exception as e:
			errors.append(f"Row {i}: {str(e)[:100]}")

	frappe.db.commit()
	frappe.publish_realtime(
		"bulk_import_complete",
		{"created": created, "updated": updated, "errors": errors},
	)


@frappe.whitelist()
def bulk_update_stock(file_url):
	"""
	Bulk update stock from CSV.

	CSV columns: variant (name or title), quantity
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	frappe.enqueue(
		_process_stock_update,
		file_url=file_url,
		queue="default",
		timeout=600,
	)

	return {"message": "Stock update started. You'll be notified when it's complete."}


def _process_stock_update(file_url):
	"""Process stock update CSV in background."""
	from velora_verse.velora_verse.doctype.inventory_log.inventory_log import create_inventory_log

	file_doc = frappe.get_doc("File", {"file_url": file_url})
	content = file_doc.get_content()

	if isinstance(content, bytes):
		content = content.decode("utf-8")

	reader = csv.DictReader(io.StringIO(content))
	updated = 0
	errors = []

	for i, row in enumerate(reader, start=2):
		try:
			variant = row.get("variant", "").strip()
			new_qty = cint(row.get("quantity", 0))

			if not variant:
				continue

			# Try by name first, then by title
			if not frappe.db.exists("Variants", variant):
				variant = frappe.db.get_value("Variants", {"title": variant}, "name")

			if not variant:
				errors.append(f"Row {i}: Variant not found")
				continue

			current_qty = frappe.db.get_value("Variants", variant, "quantity") or 0
			change = new_qty - current_qty

			frappe.db.set_value("Variants", variant, "quantity", new_qty)
			frappe.db.set_value("Variants", variant, "is_stock", 1 if new_qty > 0 else 0)

			create_inventory_log(
				variant=variant,
				change_type="Adjustment",
				quantity_change=change,
				previous_qty=current_qty,
				new_qty=new_qty,
				reference_type="Bulk Update",
				reference_name=f"Bulk stock update by {frappe.session.user}",
			)

			updated += 1

			if updated % 50 == 0:
				frappe.db.commit()

		except Exception as e:
			errors.append(f"Row {i}: {str(e)[:100]}")

	frappe.db.commit()
	frappe.publish_realtime(
		"bulk_stock_update_complete",
		{"updated": updated, "errors": errors},
	)


@frappe.whitelist()
def bulk_update_prices(file_url):
	"""
	Bulk update prices from CSV.

	CSV columns: variant (name or title), price
	"""
	if "Store Admin" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Access denied.", frappe.PermissionError)

	frappe.enqueue(
		_process_price_update,
		file_url=file_url,
		queue="default",
		timeout=600,
	)

	return {"message": "Price update started. You'll be notified when it's complete."}


def _process_price_update(file_url):
	"""Process price update CSV in background."""
	file_doc = frappe.get_doc("File", {"file_url": file_url})
	content = file_doc.get_content()

	if isinstance(content, bytes):
		content = content.decode("utf-8")

	reader = csv.DictReader(io.StringIO(content))
	updated = 0
	errors = []

	for i, row in enumerate(reader, start=2):
		try:
			variant = row.get("variant", "").strip()
			new_price = flt(row.get("price", 0))

			if not variant or new_price <= 0:
				continue

			# Try by name first, then by title
			if not frappe.db.exists("Variants", variant):
				variant = frappe.db.get_value("Variants", {"title": variant}, "name")

			if not variant:
				errors.append(f"Row {i}: Variant not found")
				continue

			frappe.db.set_value("Variants", variant, "price", new_price)
			updated += 1

			if updated % 50 == 0:
				frappe.db.commit()

		except Exception as e:
			errors.append(f"Row {i}: {str(e)[:100]}")

	frappe.db.commit()
	frappe.publish_realtime(
		"bulk_price_update_complete",
		{"updated": updated, "errors": errors},
	)
