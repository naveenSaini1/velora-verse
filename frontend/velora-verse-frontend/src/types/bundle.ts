/**
 * Product Bundle types reflecting the Product Bundle and Bundle Items DocTypes.
 *
 * Bundles are autonamed VV-BDL-.##### and group multiple variants together
 * at a discounted bundle_price. Savings are auto-calculated from the sum of
 * individual item prices vs. the bundle price.
 */

// ---------------------------------------------------------------------------
// Bundle item (child table: Bundle Items)
// ---------------------------------------------------------------------------

export interface BundleItem {
	/** Frappe child-table row name */
	name: string;
	/** Link to Variants document */
	variant: string;
	/** Variant display title (fetched from variant.title) */
	variant_title?: string;
	/** Resolved parent item name for display */
	item_name?: string;
	/** Resolved variant description (e.g. "Red / XL") */
	variant_display?: string;
	/** Quantity of this variant in the bundle */
	quantity: number;
	/** Individual (non-bundled) price of this variant */
	individual_price: number;
	/** Product image URL */
	image?: string;
	/** Product slug for linking to PDP */
	slug?: string;
}

// ---------------------------------------------------------------------------
// Product Bundle (DocType: Product Bundle, autoname VV-BDL-.#####)
// ---------------------------------------------------------------------------

export interface Bundle {
	/** Frappe document name (e.g. "VV-BDL-00001") */
	name: string;
	/** Bundle display name */
	bundle_name: string;
	/** URL-friendly slug */
	slug?: string;
	/** Bundle description */
	description?: string;
	/** Bundle hero image */
	image?: string;
	/** Whether the bundle is available for purchase */
	is_active: boolean;
	/** Items included in the bundle */
	bundle_items: BundleItem[];
	/** Sum of individual item prices (individual_total) */
	total_price: number;
	/** Actual bundle selling price */
	bundle_price: number;
	/** Absolute savings (total_price - bundle_price) */
	savings: number;
	/** Savings as a percentage of total_price */
	savings_percent: number;
}
