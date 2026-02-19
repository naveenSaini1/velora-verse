/**
 * Cart types reflecting the Cart and Cart Items DocTypes.
 *
 * The Cart DocType is keyed by user (autoname: field:user) so each
 * logged-in user has exactly one cart document.
 */

// ---------------------------------------------------------------------------
// Cart item (child table: Cart Items)
// ---------------------------------------------------------------------------

export interface CartItem {
	/** Frappe child-table row name */
	name?: string;
	/** Link to Variants document */
	variant: string;
	/** Display title of the variant (fetched from variant.title) */
	variant_title?: string;
	/** Resolved item name for display */
	item_name?: string;
	/** Human-readable variant description (e.g. "Red / XL") */
	variant_display?: string;
	/** Number of units in cart */
	quantity: number;
	/** Unit price (fetched from variant.price) */
	rate: number;
	/** Line total (quantity * rate) */
	amount: number;
	/** Primary image URL for the variant or item */
	image?: string;
	/** Product slug for linking to PDP */
	slug?: string;
	/** Maximum available quantity for stock validation */
	max_qty?: number;
	/** Whether this item is part of a bundle */
	is_bundle_item?: boolean | number;
	/** Reference to the Product Bundle if is_bundle_item */
	bundle_reference?: string;
}

// ---------------------------------------------------------------------------
// Cart (DocType: Cart, autoname field:user)
// ---------------------------------------------------------------------------

export interface Cart {
	/** Frappe document name (same as user email) */
	name?: string;
	/** User email who owns this cart */
	user?: string;
	/** Cart line items */
	items: CartItem[];
	/** Sum of all line item amounts before discounts */
	subtotal?: number;
	/** Shipping charge (may be 0 for free shipping) */
	shipping_charge?: number;
	/** Coupon/promo discount amount */
	discount_amount?: number;
	/** Tax amount */
	tax_amount?: number;
	/** Grand total after discounts, tax, and shipping */
	total: number;
	/** Applied coupon code, if any */
	coupon_code?: string;
	/** Total number of items in cart (sum of quantities) */
	item_count?: number;
}
