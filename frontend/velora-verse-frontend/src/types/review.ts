/**
 * Review types reflecting the Review DocType.
 *
 * Reviews are autonamed by hash and linked to both an Item and optionally
 * a specific Variant. The is_verified flag is set server-side based on
 * whether the user has a delivered order for the reviewed product.
 */

export interface Review {
	name: string;
	item: string;
	variant?: string;
	user: string;
	user_name?: string;
	/** 0.0–1.0 scale (displayed as 1–5 stars) */
	rating: number;
	review_title?: string;
	review_text?: string;
	is_verified?: number;
	helpful_count: number;
	creation: string;
}

/** Payload for submitting a new review. */
export interface ReviewPayload {
	item: string;
	variant?: string;
	rating: number;
	review_title?: string;
	review_text?: string;
}

/** Aggregated review stats for a product. */
export interface ReviewSummary {
	average_rating: number;
	review_count: number;
	/** Breakdown by star rating (index 0 = 1 star, index 4 = 5 stars) */
	rating_distribution: number[];
}
