/**
 * Address types reflecting the Address DocType.
 *
 * Autonamed as format:{full_name}-{address_type}-{city}.
 * Each address belongs to a User and can be Shipping or Billing type.
 */

export type AddressType = "Shipping" | "Billing";

export interface Address {
	/** Frappe document name (auto-generated from full_name-address_type-city) */
	name: string;
	/** Link to User who owns this address */
	user: string;
	/** Recipient full name */
	full_name: string;
	/** Contact phone number */
	phone: string;
	/** Whether this is a shipping or billing address */
	address_type: AddressType;
	/** Whether this is the user's default address for this type */
	is_default: boolean;
	/** Street address line 1 */
	address_line_1: string;
	/** Street address line 2 (apartment, suite, etc.) */
	address_line_2?: string;
	/** City name */
	city: string;
	/** State/province */
	state: string;
	/** Postal/PIN code */
	pincode: string;
	/** Country (defaults to "India") */
	country: string;
}

/** Payload for creating or updating an address. */
export interface AddressPayload {
	full_name: string;
	phone: string;
	address_type: AddressType;
	is_default?: boolean;
	address_line_1: string;
	address_line_2?: string;
	city: string;
	state: string;
	pincode: string;
	country?: string;
}
