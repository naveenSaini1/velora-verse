/**
 * Product-related types reflecting the Items, Images, Category, Variants,
 * Variant Table, and Variant Properties DocTypes from the Frappe backend.
 */

// ---------------------------------------------------------------------------
// Product image (child table: Images)
// ---------------------------------------------------------------------------

export interface ProductImage {
	/** Frappe row name (hash) */
	name: string;
	/** URL path to the image file */
	image: string;
	/** Alternative text for accessibility */
	alt_text?: string;
	/** Whether this is the hero/primary image */
	is_primary: boolean;
	/** Sort order within the gallery */
	display_order: number;
}

// ---------------------------------------------------------------------------
// Item category (child table: Item Category)
// ---------------------------------------------------------------------------

export interface ProductCategory {
	/** Category DocType name (same as category_name) */
	category: string;
	/** Human-readable category name */
	category_name: string;
	/** Parent category name, if any */
	parent_category?: string;
	/** Whether this is the primary category for the item */
	is_primary: boolean;
}

// ---------------------------------------------------------------------------
// Variant property value (child table: Variant Table)
// ---------------------------------------------------------------------------

export interface VariantValue {
	/** Link to Variants Type (e.g. "Color", "Size") */
	type: string;
	/** Link to Variant Properties (the specific value, e.g. "Red", "XL") */
	value: string;
}

// ---------------------------------------------------------------------------
// Product variant (DocType: Variants, naming_series)
// ---------------------------------------------------------------------------

export interface ProductVariant {
	/** Frappe document name (e.g. "ITEM-0001-RED-XL") */
	name: string;
	/** Link to parent Items document */
	variant_name: string;
	/** Auto-generated display title (e.g. "Cotton T-Shirt - Red / XL") */
	title: string;
	/** Variant-specific SKU */
	sku?: string;
	/** Variant price (Currency) */
	price: number;
	/** Available quantity */
	quantity: number;
	/** Whether the variant is currently in stock */
	is_stock: boolean;
	/** Weight in kg for shipping calculation */
	weight?: number;
	/** Barcode string */
	barcode?: string;
	/** URL-friendly slug */
	slug?: string;
	/** Number of times wishlisted */
	wishlist_count: number;
	/** Variant attribute values (e.g. Color=Red, Size=XL) */
	variant_values: VariantValue[];
	/** Variant-specific images */
	images?: ProductImage[];
}

// ---------------------------------------------------------------------------
// Full product (DocType: Items, autoname ITEM-.####)
// ---------------------------------------------------------------------------

export interface Product {
	/** Frappe document name (e.g. "ITEM-0001") */
	name: string;
	/** Human-readable product name */
	item_name: string;
	/** URL-friendly slug, auto-generated from item_name */
	slug: string;
	/** Rich-text product description (HTML) */
	description?: string;
	/** Base price before any discounts or variant overrides */
	base_price: number;
	/** Sale/discounted price if applicable (computed by promotion logic) */
	sale_price?: number;
	/** SKU at the item level */
	sku?: string;
	/** Item Type link (e.g. "Physical", "Digital") */
	type?: string;
	/** Document status: Draft, Active, or Discontinued */
	status: "Draft" | "Active" | "Discontinued";
	/** Whether the item has any in-stock variants */
	in_stock: boolean;
	/** Whether the item is marked as featured */
	is_featured: boolean;
	/** Whether the item is visible on the storefront */
	published: boolean;
	/** Whether the item has variant options */
	has_variants: boolean;
	/** Total stock quantity across all variants */
	stock_qty?: number;
	/** Average review rating (0.0 - 1.0 scale in Frappe Rating field) */
	average_rating: number;
	/** Total number of reviews */
	review_count: number;
	/** HSN Code link for GST tax calculation */
	hsn_code?: string;
	/** SEO meta title */
	meta_title?: string;
	/** SEO meta description */
	meta_description?: string;
	/** Product images (child table: Images) */
	images: ProductImage[];
	/** Categories this product belongs to (child table: Item Category) */
	categories: ProductCategory[];
	/** Variant list when has_variants is true */
	variant_table?: ProductVariant[];
	/** Frappe creation timestamp */
	creation: string;
	/** Frappe last-modified timestamp */
	modified: string;
}

// ---------------------------------------------------------------------------
// Simplified product for listing pages
// ---------------------------------------------------------------------------

export interface ProductListItem {
	name: string;
	item_name: string;
	slug: string;
	base_price: number;
	sale_price?: number;
	status: "Draft" | "Active" | "Discontinued";
	in_stock: boolean;
	is_featured: boolean;
	has_variants: boolean;
	average_rating: number;
	review_count: number;
	type?: string;
	/** Total stock quantity across all variants (0 for non-variant items) */
	stock_qty?: number;
	/** Primary image URL (first image or the one marked is_primary) */
	image?: string;
	/** Primary category name */
	category?: string;
	creation: string;
	modified: string;
}

// ---------------------------------------------------------------------------
// Product filter descriptor (for faceted search UI)
// ---------------------------------------------------------------------------

export interface ProductFilterOption {
	label: string;
	value: string;
	count?: number;
}

export interface ProductFilter {
	field: string;
	label: string;
	options: ProductFilterOption[];
}

// ---------------------------------------------------------------------------
// Product listing request parameters
// ---------------------------------------------------------------------------

export interface ProductListParams {
	category?: string;
	item_type?: string;
	min_price?: number;
	max_price?: number;
	min_rating?: number;
	in_stock?: 0 | 1;
	is_featured?: 0 | 1;
	search?: string;
	sort_by?: "modified" | "base_price" | "average_rating" | "item_name";
	sort_order?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// ---------------------------------------------------------------------------
// Category tree (DocType: Category, autoname field:category_name)
// ---------------------------------------------------------------------------

export interface CategoryTree {
	/** Frappe document name (same as category_name) */
	name: string;
	/** Category display name */
	category_name: string;
	/** URL-friendly slug */
	slug: string;
	/** Category image URL */
	image?: string;
	/** Description text */
	description?: string;
	/** Parent category name for hierarchy */
	parent_category?: string;
	/** Whether this is a child/subcategory */
	is_child: boolean;
	/** Whether the category is visible */
	is_active: boolean;
	/** Sort priority */
	display_order: number;
	/** Nested child categories (populated client-side or by API) */
	children: CategoryTree[];
	/** Number of active items in this category */
	item_count?: number;
}
