/**
 * Promotion (flash sale) types reflecting the Promotion and Promotion Items DocTypes.
 *
 * Promotions are autonamed VV-PROMO-.##### and support percentage, flat, or
 * fixed-price discounts. They can target all items, specific items, or a category.
 */

export type DiscountType = "Percentage" | "Flat" | "Fixed Price";

export type PromotionApplyTo = "All Items" | "Specific Items" | "Category";

// ---------------------------------------------------------------------------
// Promotion item (child table: Promotion Items)
// ---------------------------------------------------------------------------

export interface PromotionItem {
	/** Reference DocType ("Items", "Variants", or "Category") */
	reference_doctype: string;
	/** Document name of the referenced item/variant/category */
	reference_name: string;
	/** Resolved item name for display */
	item_name?: string;
	/** Original price before promotion */
	original_price?: number;
	/** Price after applying the promotion discount */
	discounted_price?: number;
	/** Product image URL */
	image?: string;
	/** Product slug for linking */
	slug?: string;
}

// ---------------------------------------------------------------------------
// Promotion (DocType: Promotion, autoname VV-PROMO-.#####)
// ---------------------------------------------------------------------------

export interface Promotion {
	/** Frappe document name (e.g. "VV-PROMO-00001") */
	name: string;
	/** Promotion title/headline */
	title: string;
	/** Description (optional, for marketing copy) */
	description?: string;
	/** Type of discount applied */
	discount_type: DiscountType;
	/** Discount value (percentage amount, flat amount, or fixed price) */
	discount_value: number;
	/** When the promotion starts */
	start_date: string;
	/** When the promotion ends */
	end_date: string;
	/** Whether the promotion is currently active */
	is_active: boolean;
	/** Priority for stacking/conflict resolution (lower = higher priority) */
	priority_level: number;
	/** What the promotion applies to */
	apply_to: PromotionApplyTo;
	/** Max units a single user can purchase at promo price (0 = unlimited) */
	max_quantity_per_user: number;
	/** Total stock allocated to this promotion (0 = unlimited) */
	total_stock_limit: number;
	/** Badge text for display (e.g. "FLASH SALE", "50% OFF") */
	badge_text?: string;
	/** Banner image URL for the promotion */
	banner_image?: string;
	/** Items included in this promotion */
	items: PromotionItem[];
}
