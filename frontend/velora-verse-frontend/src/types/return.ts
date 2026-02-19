/**
 * Return Request types reflecting the Return Request (submittable) and
 * Return Request Items DocTypes.
 *
 * Return Requests are autonamed VV-RET-.##### and support both returns
 * and exchanges with multiple refund methods.
 */

export type ReturnStatus =
	| "Pending"
	| "Approved"
	| "Rejected"
	| "Refund Initiated"
	| "Refund Completed"
	| "Closed";

export type ReturnType = "Return" | "Exchange";

export type ReturnReason =
	| "Defective"
	| "Wrong Item"
	| "Size Issue"
	| "Changed Mind"
	| "Other";

export type RefundMethod = "Original Payment" | "Store Credit";

// ---------------------------------------------------------------------------
// Return item (child table: Return Request Items)
// ---------------------------------------------------------------------------

export interface ReturnItem {
	/** Frappe child-table row name */
	name: string;
	/** Link to Variants document */
	variant: string;
	/** Variant display title */
	variant_title?: string;
	/** Resolved item name for display */
	item_name?: string;
	/** Resolved variant description */
	variant_name?: string;
	/** Quantity being returned */
	quantity: number;
	/** Unit rate at time of original order */
	rate: number;
	/** Line amount (quantity * rate) */
	amount: number;
	/** Reason for returning this specific item */
	reason?: string;
}

// ---------------------------------------------------------------------------
// Return Request (DocType: Return Request, autoname VV-RET-.#####, submittable)
// ---------------------------------------------------------------------------

export interface ReturnRequest {
	/** Frappe document name (e.g. "VV-RET-00001") */
	name: string;
	/** Link to the original Order document */
	order: string;
	/** User who filed the return request */
	user: string;
	/** Date/time the return was requested */
	request_date: string;
	/** Current return status */
	status: ReturnStatus;
	/** Whether this is a return or exchange */
	return_type: ReturnType;
	/** Primary reason for return */
	reason: ReturnReason;
	/** Detailed reason description */
	reason_detail?: string;
	/** Items being returned */
	items: ReturnItem[];
	/** Total refund amount */
	refund_amount: number;
	/** How the refund will be issued */
	refund_method: RefundMethod;
	/** External refund transaction ID */
	refund_transaction_id?: string;
	/** Admin notes on the return */
	admin_notes?: string;
	/** User who approved/rejected the return */
	approved_by?: string;
	/** Timestamp of approval/rejection */
	approved_on?: string;
	/** Frappe creation timestamp */
	creation: string;
	/** Frappe last-modified timestamp */
	modified: string;
}

/** Payload for submitting a new return request. */
export interface ReturnRequestPayload {
	order: string;
	return_type: ReturnType;
	reason: ReturnReason;
	reason_detail?: string;
	refund_method?: RefundMethod;
	items: {
		variant: string;
		quantity: number;
	}[];
}
