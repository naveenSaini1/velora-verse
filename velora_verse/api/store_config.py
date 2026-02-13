import frappe

from velora_verse.utils import get_store_settings


@frappe.whitelist(allow_guest=True)
def get_store_config():
	"""Return non-sensitive store settings for the frontend."""
	settings = get_store_settings()
	return {
		"store_name": settings.store_name,
		"store_logo": settings.store_logo,
		"currency": settings.currency,
		"currency_symbol": settings.currency_symbol,
		"enable_gst": settings.enable_gst,
		"gst_included_in_price": settings.gst_included_in_price,
		"free_shipping_threshold": settings.free_shipping_threshold,
		"min_order_value": settings.min_order_value,
		"cod_enabled": settings.cod_enabled,
		"razorpay_enabled": settings.razorpay_enabled,
		"razorpay_key_id": settings.razorpay_key_id,
		"enable_loyalty_points": settings.enable_loyalty_points,
		"points_to_currency_ratio": settings.points_to_currency_ratio,
		"min_points_to_redeem": settings.min_points_to_redeem,
		"enable_gift_cards": settings.enable_gift_cards,
		"gift_card_denominations": settings.gift_card_denominations,
		"enable_analytics": settings.enable_analytics,
		"enable_pincode_check": settings.enable_pincode_check,
		"enable_customer_segments": settings.enable_customer_segments,
	}
