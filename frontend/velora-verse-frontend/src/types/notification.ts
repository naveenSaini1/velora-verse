/**
 * User Notification types reflecting the User Notification DocType.
 *
 * Notifications are autonamed by hash and support various types including
 * order updates, promotions, back-in-stock alerts, and more.
 */

export type NotificationType =
	| "Order"
	| "Promotion"
	| "Back in Stock"
	| "Review"
	| "Loyalty"
	| "Gift Card"
	| "General";

export interface UserNotification {
	/** Frappe document name (hash) */
	name: string;
	/** Notification title */
	title: string;
	/** Notification body/message */
	message?: string;
	/** Category of notification */
	notification_type: NotificationType;
	/** DocType the notification references (e.g. "Order", "Promotion") */
	reference_doctype?: string;
	/** Document name of the referenced record */
	reference_name?: string;
	/** Whether the user has read this notification */
	is_read: boolean;
	/** URL to navigate to when the notification is clicked */
	action_url?: string;
	/** Frappe creation timestamp */
	creation: string;
}

/** Summary counts for the notification bell icon. */
export interface NotificationCounts {
	total: number;
	unread: number;
}
