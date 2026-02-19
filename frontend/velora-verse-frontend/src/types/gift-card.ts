/**
 * Gift Card types reflecting the Gift Card and Gift Card Transaction DocTypes.
 *
 * Gift Cards are autonamed by field:card_code. They support purchase, redemption,
 * refund, and expiry transactions tracked in a child table.
 */

export type GiftCardStatus = "Active" | "Fully Redeemed" | "Expired" | "Deactivated";

export type GiftCardTransactionType = "Purchase" | "Redemption" | "Refund" | "Expiry";

// ---------------------------------------------------------------------------
// Gift card transaction (child table: Gift Card Transaction)
// ---------------------------------------------------------------------------

export interface GiftCardTransaction {
	/** Frappe child-table row name */
	name: string;
	/** Type of transaction */
	transaction_type: GiftCardTransactionType;
	/** Transaction amount */
	amount: number;
	/** Balance remaining after this transaction */
	balance_after: number;
	/** Order reference if transaction is tied to an order */
	order?: string;
	/** User who redeemed (for redemption transactions) */
	redeemed_by?: string;
	/** Transaction timestamp */
	creation: string;
}

// ---------------------------------------------------------------------------
// Gift Card (DocType: Gift Card, autoname field:card_code)
// ---------------------------------------------------------------------------

export interface GiftCard {
	/** Frappe document name (same as card_code) */
	name: string;
	/** Unique gift card code */
	card_code: string;
	/** Original loaded amount */
	initial_amount: number;
	/** Current remaining balance */
	balance: number;
	/** Card status */
	status: GiftCardStatus;
	/** Email of the user who purchased the card */
	sender_email?: string;
	/** Recipient email address */
	recipient_email?: string;
	/** Recipient display name */
	recipient_name?: string;
	/** Personal message from sender to recipient */
	message?: string;
	/** Date/time the card was purchased */
	purchased_on?: string;
	/** Expiration date */
	expires_on?: string;
	/** Transaction history */
	transactions: GiftCardTransaction[];
}

/** Payload for purchasing a new gift card. */
export interface GiftCardPurchasePayload {
	amount: number;
	recipient_email: string;
	recipient_name?: string;
	message?: string;
}

/** Payload for redeeming/applying a gift card to an order. */
export interface GiftCardRedeemPayload {
	card_code: string;
	amount?: number;
}
