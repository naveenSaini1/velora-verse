# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Invoice PDF generation API."""

import frappe
from frappe.utils import fmt_money


@frappe.whitelist()
def download_invoice(order_name):
	"""Generate and return a PDF invoice for an order."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to download invoices.")

	if not frappe.db.exists("Order", order_name):
		frappe.throw("Order not found.", frappe.DoesNotExistError)

	order = frappe.get_doc("Order", order_name)

	# Permission check: customer can only download own invoices
	if "Store Admin" not in frappe.get_roles(user) and user != "Administrator":
		if order.user != user:
			frappe.throw("You do not have permission to access this order.", frappe.PermissionError)

	# Only allow invoice download for submitted orders
	if order.docstatus != 1:
		frappe.throw("Invoice is only available for confirmed orders.")

	html = _render_invoice_html(order)
	pdf = frappe.utils.pdf.get_pdf(html)

	frappe.local.response.filename = f"Invoice-{order.name}.pdf"
	frappe.local.response.filecontent = pdf
	frappe.local.response.type = "pdf"


def _render_invoice_html(order):
	"""Render the invoice HTML from the Jinja template."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	store_name = getattr(settings, "store_name", "Velora Verse") or "Velora Verse"

	# Get order items
	items = order.get("order_items") or []

	item_rows = ""
	for idx, item in enumerate(items, 1):
		item_name = item.get("item_name") or item.get("variant_name") or ""
		qty = item.get("quantity") or item.get("qty") or 1
		rate = item.get("rate") or item.get("price") or 0
		amount = item.get("amount") or (float(rate) * int(qty))
		item_rows += f"""
		<tr>
			<td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">{idx}</td>
			<td style="padding: 8px 12px; border-bottom: 1px solid #eee;">{frappe.utils.escape_html(item_name)}</td>
			<td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">{qty}</td>
			<td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">{fmt_money(rate, currency="INR")}</td>
			<td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">{fmt_money(amount, currency="INR")}</td>
		</tr>
		"""

	# Build discount rows
	discount_rows = ""
	for label, field in [
		("Coupon Discount", "coupon_discount"),
		("Loyalty Points Discount", "loyalty_discount"),
		("Gift Card Applied", "gift_card_discount"),
		("Segment Discount", "segment_discount"),
	]:
		val = getattr(order, field, 0) or 0
		if float(val) > 0:
			discount_rows += f"""
			<tr>
				<td colspan="4" style="padding: 4px 12px; text-align: right; color: #16a34a;">{label}</td>
				<td style="padding: 4px 12px; text-align: right; color: #16a34a;">-{fmt_money(val, currency="INR")}</td>
			</tr>
			"""

	shipping = getattr(order, "shipping_charges", 0) or 0
	tax = getattr(order, "tax_amount", 0) or 0

	html = f"""
	<!DOCTYPE html>
	<html>
	<head><meta charset="utf-8"></head>
	<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #222; max-width: 700px; margin: 0 auto; padding: 40px 20px;">

		<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
			<div>
				<h1 style="margin: 0; font-size: 24px; font-weight: 700;">{frappe.utils.escape_html(store_name)}</h1>
				<p style="color: #666; margin: 4px 0 0; font-size: 13px;">Tax Invoice</p>
			</div>
			<div style="text-align: right;">
				<p style="margin: 0; font-size: 14px; font-weight: 600;">Invoice #{frappe.utils.escape_html(order.name)}</p>
				<p style="color: #666; margin: 4px 0 0; font-size: 13px;">Date: {frappe.utils.format_date(order.creation)}</p>
			</div>
		</div>

		<hr style="border: none; border-top: 2px solid #222; margin-bottom: 20px;" />

		<div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
			<div>
				<p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Bill To</p>
				<p style="margin: 0; font-size: 14px; white-space: pre-line;">{frappe.utils.escape_html(order.billing_address_display or order.shipping_address_display or "")}</p>
			</div>
			<div style="text-align: right;">
				<p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Ship To</p>
				<p style="margin: 0; font-size: 14px; white-space: pre-line;">{frappe.utils.escape_html(order.shipping_address_display or "")}</p>
			</div>
		</div>

		<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
			<thead>
				<tr style="background: #f8f8f8;">
					<th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #ddd; width: 40px;">#</th>
					<th style="padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd;">Item</th>
					<th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #ddd; width: 60px;">Qty</th>
					<th style="padding: 10px 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #ddd; width: 100px;">Rate</th>
					<th style="padding: 10px 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #ddd; width: 100px;">Amount</th>
				</tr>
			</thead>
			<tbody>
				{item_rows}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="4" style="padding: 6px 12px; text-align: right; font-weight: 500;">Subtotal</td>
					<td style="padding: 6px 12px; text-align: right;">{fmt_money(order.subtotal or 0, currency="INR")}</td>
				</tr>
				{discount_rows}
				<tr>
					<td colspan="4" style="padding: 6px 12px; text-align: right; font-weight: 500;">Shipping</td>
					<td style="padding: 6px 12px; text-align: right;">{fmt_money(shipping, currency="INR")}</td>
				</tr>
				<tr>
					<td colspan="4" style="padding: 6px 12px; text-align: right; font-weight: 500;">Tax (GST)</td>
					<td style="padding: 6px 12px; text-align: right;">{fmt_money(tax, currency="INR")}</td>
				</tr>
				<tr style="font-size: 15px; font-weight: 700;">
					<td colspan="4" style="padding: 12px; text-align: right; border-top: 2px solid #222;">Grand Total</td>
					<td style="padding: 12px; text-align: right; border-top: 2px solid #222;">{fmt_money(order.total or 0, currency="INR")}</td>
				</tr>
			</tfoot>
		</table>

		<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px;">
			<p>Thank you for shopping with {frappe.utils.escape_html(store_name)}</p>
		</div>
	</body>
	</html>
	"""
	return html
