/**
 * Order types reflecting the Order (submittable) and Order Items DocTypes.
 *
 * Order is autonamed VV-ORD-.##### and supports the full discount stack:
 * coupon, loyalty points, customer segment discount, and gift card redemption.
 */

// ---------------------------------------------------------------------------
// Order status enums
// ---------------------------------------------------------------------------

export type OrderStatus =
	| "Pending"
	| "Confirmed"
	| "Processing"
	| "Shipped"
	| "Delivered"
	| "Cancelled"
	| "Returned";

export type PaymentStatus =
	| "Unpaid"
	| "Paid"
	| "Refunded"
	| "Partially Refunded";

// ---------------------------------------------------------------------------
// Order item (child table: Order Items)
// ---------------------------------------------------------------------------

export interface OrderItem {
	/** Frappe child-table row name */
	name: string;
	/** Link to Variants document */
	variant: string;
	/** Item name (fetched from variant.variant_name) */
	item_name: string;
	/** Variant title (fetched from variant.title, e.g. "Cotton T-Shirt - Red / XL") */
	variant_title?: string;
	/** Quantity ordered */
	quantity: number;
	/** Unit rate at time of order */
	rate: number;
	/** Line amount (quantity * rate) */
	amount: number;
	/** HSN code for tax */
	hsn_code?: string;
	/** Per-item tax rate percentage */
	tax_rate: number;
	/** Per-item tax amount */
	tax_amount: number;
	/** Whether this line is part of a bundle purchase */
	is_bundle_item: boolean;
	/** Bundle reference identifier */
	bundle_reference?: string;
	/** Product image URL (resolved for display) */
	image?: string;
	/** Product slug for linking back to PDP */
	slug?: string;
}

// ---------------------------------------------------------------------------
// Order (DocType: Order, autoname VV-ORD-.#####, submittable)
// ---------------------------------------------------------------------------

export interface Order {
	/** Frappe document name (e.g. "VV-ORD-00001") */
	name: string;
	/** User who placed the order */
	user: string;
	/** Order date/time */
	order_date: string;
	/** Current order status */
	status: OrderStatus;
	/** Payment status */
	payment_status: PaymentStatus;
	/** Payment method used (e.g. "COD", "Razorpay") */
	payment_method?: string;
	/** External payment ID (e.g. Razorpay payment ID) */
	payment_id?: string;

	// -- Addresses --
	/** Link to shipping Address document */
	shipping_address: string;
	/** Formatted shipping address text for display */
	shipping_address_display?: string;
	/** Link to billing Address document */
	billing_address?: string;
	/** Formatted billing address text for display */
	billing_address_display?: string;

	// -- Line items --
	/** Ordered items */
	items: OrderItem[];

	// -- Totals & discounts --
	/** Subtotal before discounts and tax */
	subtotal: number;
	/** Applied coupon code */
	coupon_code?: string;
	/** Coupon discount amount */
	discount_amount: number;
	/** Overall tax rate percentage */
	tax_rate: number;
	/** Total tax amount */
	tax_amount: number;
	/** Shipping charge */
	shipping_charge: number;
	/** Grand total */
	total: number;

	// -- Loyalty points --
	/** Number of loyalty points redeemed on this order */
	loyalty_points_redeemed: number;
	/** Currency value of redeemed loyalty points */
	loyalty_discount: number;
	/** Loyalty points earned from this order */
	loyalty_points_earned: number;

	// -- Customer segment --
	/** Applied customer segment name */
	segment_name?: string;
	/** Segment-based discount amount */
	segment_discount: number;

	// -- Gift card --
	/** Gift card code used */
	gift_card_code?: string;
	/** Gift card amount applied */
	gift_card_amount: number;

	// -- GST breakdown --
	/** Whether IGST applies (inter-state) vs CGST+SGST (intra-state) */
	is_igst: boolean;
	/** CGST amount */
	cgst_amount: number;
	/** SGST amount */
	sgst_amount: number;
	/** IGST amount */
	igst_amount: number;
	/** Cess amount */
	cess_amount: number;

	// -- Shipping & tracking --
	/** Shipment tracking number */
	tracking_number?: string;
	/** Tracking URL */
	tracking_url?: string;
	/** Delivery timestamp */
	delivered_on?: string;

	// -- Notes --
	/** Order notes */
	notes?: string;
	/** Reason for cancellation if cancelled */
	cancelled_reason?: string;

	/** Number of items (available in list view) */
	item_count?: number;

	/** Frappe creation timestamp */
	creation: string;
	/** Frappe last-modified timestamp */
	modified: string;
}
