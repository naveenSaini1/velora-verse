/**
 * Store Settings types reflecting the Store Settings SingleDoc DocType.
 *
 * This is a SingleDoc (issingle: 1) so there is exactly one instance,
 * accessed at /api/resource/Store Settings/Store Settings.
 * Not all fields are exposed to the frontend -- this interface covers
 * the public-facing configuration the storefront needs.
 */

export interface StoreSettings {
	// -- General --
	/** Store display name */
	store_name: string;
	/** Store contact email */
	store_email?: string;
	/** Store contact phone */
	store_phone?: string;
	/** Store logo image URL */
	store_logo?: string;
	/** Currency code (e.g. "INR") */
	currency: string;
	/** Currency display symbol (e.g. "Rs.") */
	currency_symbol: string;

	// -- GST --
	/** Whether GST tax calculation is enabled */
	enable_gst: boolean;
	/** Store GSTIN number */
	gstin?: string;
	/** Default GST rate percentage */
	gst_rate: number;
	/** Whether listed product prices already include GST */
	gst_included_in_price: boolean;
	/** Whether HSN-based per-item tax rates are enabled */
	enable_hsn_tax: boolean;
	/** State where the store is registered (for CGST/SGST vs IGST) */
	store_state?: string;

	// -- Shipping --
	/** Whether shipping charges are enabled */
	enable_shipping_charges: boolean;
	/** Order subtotal above which shipping is free (0 = no free shipping) */
	free_shipping_threshold: number;
	/** Default flat shipping charge */
	default_shipping_charge: number;
	/** Per-kg shipping rate for weight-based calculation */
	shipping_rate_per_kg: number;
	/** Whether pincode serviceability check is enabled */
	enable_pincode_check: boolean;

	// -- Order --
	/** Minimum order value required for checkout (0 = no minimum) */
	min_order_value: number;
	/** Hours before unpaid online orders are auto-cancelled (0 = disabled) */
	auto_cancel_unpaid_hours: number;
	/** Whether cash on delivery payment is available */
	cod_enabled: boolean;

	// -- Razorpay --
	/** Whether Razorpay online payments are enabled */
	razorpay_enabled: boolean;
	/** Razorpay public key ID (safe to expose to frontend) */
	razorpay_key_id?: string;

	// -- Email notifications --
	/** Whether order confirmation emails are sent */
	send_order_confirmation: boolean;
	/** Whether shipping notification emails are sent */
	send_shipping_notification: boolean;
	/** Whether delivery confirmation emails are sent */
	send_delivery_confirmation: boolean;

	// -- Abandoned cart --
	/** Whether abandoned cart recovery emails are enabled */
	enable_abandoned_cart_email: boolean;
	/** Hours before a cart is considered abandoned */
	abandoned_cart_hours: number;

	// -- Stock alerts --
	/** Quantity threshold for low stock alerts */
	low_stock_threshold: number;
	/** Whether low stock alert emails are enabled */
	enable_low_stock_alerts: boolean;

	// -- Loyalty points --
	/** Whether the loyalty points program is enabled */
	enable_loyalty_points: boolean;
	/** How many points equal 1 currency unit */
	points_to_currency_ratio: number;
	/** Minimum points required before redemption is allowed */
	min_points_to_redeem: number;
	/** Maximum points that can be redeemed per order (0 = unlimited) */
	max_points_per_order: number;
	/** Days until earned points expire */
	points_expiry_days: number;

	// -- Gift cards --
	/** Whether the gift card feature is enabled */
	enable_gift_cards: boolean;
	/** Months until a gift card expires */
	gift_card_expiry_months: number;
	/** Comma-separated allowed denominations (empty = any amount) */
	gift_card_denominations?: string;

	// -- Customer segments --
	/** Whether customer segmentation is enabled */
	enable_customer_segments: boolean;

	// -- Analytics --
	/** Whether frontend analytics event tracking is enabled */
	enable_analytics: boolean;

	// -- Multi-warehouse --
	/** Whether multi-warehouse inventory is enabled */
	enable_multi_warehouse: boolean;
	/** Default warehouse for stock allocation */
	default_warehouse?: string;

	// -- SEO / Sitemap --
	/** Base URL for sitemap generation */
	site_base_url?: string;
	/** Sitemap change frequency hint */
	sitemap_change_frequency: "daily" | "weekly" | "monthly";
	/** Whether to include image URLs in the sitemap */
	sitemap_include_images: boolean;
}
