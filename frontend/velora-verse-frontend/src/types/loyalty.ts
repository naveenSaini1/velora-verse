/**
 * Loyalty Points types reflecting the Loyalty Points Ledger DocType
 * and the computed balance returned by the loyalty API endpoints.
 *
 * The ledger tracks individual point transactions (earn, redeem, expiry,
 * adjustment, refund) with a running balance.
 */

export type LoyaltyTransactionType =
	| "Earn"
	| "Redeem"
	| "Expiry"
	| "Adjustment"
	| "Refund";

// ---------------------------------------------------------------------------
// Loyalty balance (computed by API, not a DocType)
// ---------------------------------------------------------------------------

export interface LoyaltyBalance {
	/** Lifetime total points earned */
	total_points: number;
	/** Currently available (non-expired, non-redeemed) points */
	available_points: number;
	/** Currency equivalent of available points */
	currency_value: number;
	/** Points earned but not yet confirmed (e.g. pending delivery) */
	pending_points: number;
}

// ---------------------------------------------------------------------------
// Loyalty transaction (DocType: Loyalty Points Ledger, autoname hash)
// ---------------------------------------------------------------------------

export interface LoyaltyTransaction {
	/** Frappe document name (hash) */
	name: string;
	/** User email */
	user: string;
	/** Type of points transaction */
	transaction_type: LoyaltyTransactionType;
	/** Points added (positive) or deducted (negative) */
	points: number;
	/** Running balance after this transaction */
	running_balance: number;
	/** Whether these points have expired */
	is_expired: boolean;
	/** Reference DocType (e.g. "Order") */
	reference_doctype?: string;
	/** Reference document name (e.g. "VV-ORD-00001") */
	reference_name?: string;
	/** Alias for reference_name for convenience */
	order?: string;
	/** Date when earned points expire */
	expiry_date?: string;
	/** Frappe creation timestamp */
	creation: string;
}
