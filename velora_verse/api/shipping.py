# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Shipping charge calculation with zone-based and weight-based logic."""

import frappe
from velora_verse.utils import get_store_settings


def calculate_shipping(order_items, shipping_state=None):
	"""
	Calculate shipping charge for an order.

	Args:
		order_items: list of dicts with 'variant' and 'quantity' keys
		shipping_state: state name from shipping address (for zone lookup)

	Returns:
		dict with shipping_charge, free_shipping (bool), zone_name
	"""
	settings = get_store_settings()

	if not settings.enable_shipping_charges:
		return {"shipping_charge": 0, "free_shipping": True, "zone_name": None}

	# Calculate order subtotal and total weight
	subtotal = 0
	total_weight = 0

	for item in order_items:
		variant_name = item.get("variant") if isinstance(item, dict) else item.variant
		quantity = item.get("quantity", 1) if isinstance(item, dict) else item.quantity
		rate = item.get("rate") or item.get("amount", 0)

		if isinstance(item, dict):
			subtotal += (rate or 0) * quantity
		else:
			subtotal += (item.amount or 0)

		# Get variant weight
		weight = frappe.db.get_value("Variants", variant_name, "weight") or 0
		total_weight += weight * quantity

	# Check zone-specific settings
	zone = _find_shipping_zone(settings, shipping_state)
	zone_name = zone.zone_name if zone else None

	# Determine free shipping threshold
	free_threshold = 0
	if zone and zone.free_shipping_threshold:
		free_threshold = zone.free_shipping_threshold
	elif settings.free_shipping_threshold:
		free_threshold = settings.free_shipping_threshold

	# Check free shipping
	if free_threshold and subtotal >= free_threshold:
		return {"shipping_charge": 0, "free_shipping": True, "zone_name": zone_name}

	# Calculate charge
	if zone:
		charge = zone.flat_rate or 0
		if zone.rate_per_kg and total_weight > 0:
			charge += zone.rate_per_kg * total_weight
	else:
		charge = settings.default_shipping_charge or 0
		if settings.shipping_rate_per_kg and total_weight > 0:
			charge += settings.shipping_rate_per_kg * total_weight

	return {
		"shipping_charge": round(charge, 2),
		"free_shipping": False,
		"zone_name": zone_name,
	}


def _find_shipping_zone(settings, shipping_state):
	"""Find the matching shipping zone for a given state."""
	if not shipping_state or not settings.shipping_zones:
		return None

	shipping_state_lower = shipping_state.strip().lower()

	for zone in settings.shipping_zones:
		if not zone.states:
			continue
		zone_states = [s.strip().lower() for s in zone.states.split(",")]
		if shipping_state_lower in zone_states:
			return zone

	return None


@frappe.whitelist(allow_guest=True)
def check_pincode(pincode):
	"""
	Check if a pincode is serviceable for delivery.

	Args:
		pincode: The delivery pincode to check

	Returns:
		dict with serviceable, city, state, cod_available, estimated_days
	"""
	if not pincode:
		frappe.throw("Pincode is required.")

	settings = get_store_settings()

	# If pincode check is disabled, always return serviceable
	if not settings.enable_pincode_check:
		return {
			"serviceable": True,
			"city": None,
			"state": None,
			"cod_available": bool(settings.cod_enabled),
			"estimated_days": 5,
			"message": "Delivery available",
		}

	pin_data = frappe.db.get_value(
		"Serviceable Pincode",
		{"pincode": pincode},
		["is_serviceable", "city", "state", "cod_available", "estimated_days"],
		as_dict=True,
	)

	if not pin_data:
		return {
			"serviceable": False,
			"city": None,
			"state": None,
			"cod_available": False,
			"estimated_days": None,
			"message": "Sorry, delivery is not available to this pincode.",
		}

	if not pin_data.is_serviceable:
		return {
			"serviceable": False,
			"city": pin_data.city,
			"state": pin_data.state,
			"cod_available": False,
			"estimated_days": None,
			"message": "Sorry, delivery is not available to this pincode.",
		}

	return {
		"serviceable": True,
		"city": pin_data.city,
		"state": pin_data.state,
		"cod_available": bool(pin_data.cod_available),
		"estimated_days": pin_data.estimated_days or 5,
		"message": f"Delivery available to {pin_data.city}, {pin_data.state}",
	}


@frappe.whitelist()
def get_shipping_rates(shipping_address):
	"""
	Preview shipping charge for a given address before checkout.

	Args:
		shipping_address: Address document name
	"""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to check shipping rates.")

	if not frappe.db.exists("Address", shipping_address):
		frappe.throw("Address not found.")

	addr_user = frappe.db.get_value("Address", shipping_address, "user")
	if addr_user != user and user != "Administrator":
		frappe.throw("Invalid address.")

	state = frappe.db.get_value("Address", shipping_address, "state")

	# Get user's cart items
	cart_name = frappe.db.get_value("Cart", {"user": user})
	if not cart_name:
		return {"shipping_charge": 0, "free_shipping": True, "zone_name": None, "message": "Cart is empty"}

	cart_items = frappe.get_all(
		"Cart Items",
		filters={"parent": cart_name},
		fields=["variant", "quantity", "rate"],
	)

	if not cart_items:
		return {"shipping_charge": 0, "free_shipping": True, "zone_name": None, "message": "Cart is empty"}

	# Calculate subtotal from variant prices
	for item in cart_items:
		variant_price = frappe.db.get_value("Variants", item.variant, "price") or 0
		item["rate"] = variant_price
		item["amount"] = variant_price * item.quantity

	result = calculate_shipping(cart_items, state)
	return result
