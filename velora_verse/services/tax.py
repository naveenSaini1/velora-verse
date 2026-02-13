# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""GST tax calculation for orders — supports both flat rate and per-item HSN-based rates."""

from velora_verse.utils import get_store_settings


def calculate_gst(subtotal, discount_amount=0):
	"""
	Calculate GST on an order (flat rate mode).

	Args:
		subtotal: Order subtotal (sum of item amounts)
		discount_amount: Discount applied to the order

	Returns:
		dict with tax_rate, tax_amount, taxable_amount
	"""
	settings = get_store_settings()

	if not settings.enable_gst:
		return {"tax_rate": 0, "tax_amount": 0, "taxable_amount": subtotal - discount_amount}

	gst_rate = settings.gst_rate or 18
	taxable_amount = subtotal - (discount_amount or 0)

	if taxable_amount <= 0:
		return {"tax_rate": gst_rate, "tax_amount": 0, "taxable_amount": 0}

	if settings.gst_included_in_price:
		# GST is already included — extract it from the taxable amount
		tax_amount = taxable_amount - (taxable_amount / (1 + gst_rate / 100))
	else:
		# GST is exclusive — add on top
		tax_amount = taxable_amount * (gst_rate / 100)

	return {
		"tax_rate": gst_rate,
		"tax_amount": round(tax_amount, 2),
		"taxable_amount": round(taxable_amount, 2),
	}


def calculate_item_tax(item_name, amount, shipping_state=None):
	"""
	Calculate per-item tax using HSN code rates.

	Args:
		item_name: Items document name (to look up HSN code)
		amount: Taxable amount for this line item
		shipping_state: Customer's shipping state (for CGST/SGST vs IGST)

	Returns:
		dict with hsn_code, tax_rate, tax_amount, cgst, sgst, igst, cess
	"""
	import frappe

	settings = get_store_settings()

	if not settings.enable_gst or not getattr(settings, "enable_hsn_tax", 0):
		# Fall back to flat rate
		gst = calculate_gst(amount, 0)
		return {
			"hsn_code": None,
			"tax_rate": gst["tax_rate"],
			"tax_amount": gst["tax_amount"],
			"cgst": 0,
			"sgst": 0,
			"igst": gst["tax_amount"],
			"cess": 0,
		}

	hsn_code_name = frappe.db.get_value("Items", item_name, "hsn_code")
	if not hsn_code_name:
		# No HSN assigned — use flat rate
		gst = calculate_gst(amount, 0)
		return {
			"hsn_code": None,
			"tax_rate": gst["tax_rate"],
			"tax_amount": gst["tax_amount"],
			"cgst": 0,
			"sgst": 0,
			"igst": gst["tax_amount"],
			"cess": 0,
		}

	hsn = frappe.db.get_value(
		"HSN Code", hsn_code_name,
		["hsn_code", "cgst_rate", "sgst_rate", "igst_rate", "cess_rate", "is_active"],
		as_dict=True,
	)

	if not hsn or not hsn.is_active:
		gst = calculate_gst(amount, 0)
		return {
			"hsn_code": hsn_code_name,
			"tax_rate": gst["tax_rate"],
			"tax_amount": gst["tax_amount"],
			"cgst": 0,
			"sgst": 0,
			"igst": gst["tax_amount"],
			"cess": 0,
		}

	store_state = getattr(settings, "store_state", "") or ""
	is_igst = shipping_state and store_state and shipping_state.lower() != store_state.lower()

	if is_igst:
		igst_rate = hsn.igst_rate or 0
		tax_amount = amount * igst_rate / 100
		return {
			"hsn_code": hsn.hsn_code,
			"tax_rate": igst_rate,
			"tax_amount": round(tax_amount + amount * (hsn.cess_rate or 0) / 100, 2),
			"cgst": 0,
			"sgst": 0,
			"igst": round(tax_amount, 2),
			"cess": round(amount * (hsn.cess_rate or 0) / 100, 2),
		}
	else:
		cgst = amount * (hsn.cgst_rate or 0) / 100
		sgst = amount * (hsn.sgst_rate or 0) / 100
		cess = amount * (hsn.cess_rate or 0) / 100
		total_tax = cgst + sgst + cess
		return {
			"hsn_code": hsn.hsn_code,
			"tax_rate": (hsn.cgst_rate or 0) + (hsn.sgst_rate or 0),
			"tax_amount": round(total_tax, 2),
			"cgst": round(cgst, 2),
			"sgst": round(sgst, 2),
			"igst": 0,
			"cess": round(cess, 2),
		}


def calculate_order_tax(order_items, discount_amount=0, shipping_state=None):
	"""
	Calculate tax for an entire order — uses HSN if enabled, otherwise flat rate.

	Args:
		order_items: list of dicts with item_name, amount fields
		discount_amount: total pre-tax discount
		shipping_state: customer's shipping state

	Returns:
		dict with total tax breakdown and per-item tax info
	"""
	import frappe

	settings = get_store_settings()

	if not settings.enable_gst:
		return {
			"tax_amount": 0, "tax_rate": 0,
			"cgst_amount": 0, "sgst_amount": 0, "igst_amount": 0, "cess_amount": 0,
			"is_igst": False, "item_taxes": [],
		}

	if not getattr(settings, "enable_hsn_tax", 0):
		# Flat rate mode
		subtotal = sum(item.get("amount", 0) for item in order_items)
		gst = calculate_gst(subtotal, discount_amount)
		store_state = getattr(settings, "store_state", "") or ""
		is_igst = shipping_state and store_state and shipping_state.lower() != store_state.lower()

		if is_igst:
			return {
				"tax_amount": gst["tax_amount"], "tax_rate": gst["tax_rate"],
				"cgst_amount": 0, "sgst_amount": 0,
				"igst_amount": gst["tax_amount"], "cess_amount": 0,
				"is_igst": True, "item_taxes": [],
			}
		else:
			half = round(gst["tax_amount"] / 2, 2)
			return {
				"tax_amount": gst["tax_amount"], "tax_rate": gst["tax_rate"],
				"cgst_amount": half, "sgst_amount": gst["tax_amount"] - half,
				"igst_amount": 0, "cess_amount": 0,
				"is_igst": False, "item_taxes": [],
			}

	# HSN-based per-item tax calculation
	subtotal = sum(item.get("amount", 0) for item in order_items)
	discount_ratio = discount_amount / subtotal if subtotal > 0 else 0

	total_cgst = 0
	total_sgst = 0
	total_igst = 0
	total_cess = 0
	item_taxes = []

	for item in order_items:
		item_amount = item.get("amount", 0)
		# Proportionally distribute discount
		item_discount = item_amount * discount_ratio
		taxable = item_amount - item_discount

		item_name = item.get("item_name")
		tax = calculate_item_tax(item_name, taxable, shipping_state)

		total_cgst += tax["cgst"]
		total_sgst += tax["sgst"]
		total_igst += tax["igst"]
		total_cess += tax["cess"]

		item_taxes.append({
			"variant": item.get("variant"),
			"hsn_code": tax["hsn_code"],
			"tax_rate": tax["tax_rate"],
			"tax_amount": tax["tax_amount"],
		})

	total_tax = total_cgst + total_sgst + total_igst + total_cess
	store_state = getattr(settings, "store_state", "") or ""
	is_igst = shipping_state and store_state and shipping_state.lower() != store_state.lower()

	return {
		"tax_amount": round(total_tax, 2),
		"tax_rate": 0,  # Mixed rates with HSN
		"cgst_amount": round(total_cgst, 2),
		"sgst_amount": round(total_sgst, 2),
		"igst_amount": round(total_igst, 2),
		"cess_amount": round(total_cess, 2),
		"is_igst": is_igst,
		"item_taxes": item_taxes,
	}
