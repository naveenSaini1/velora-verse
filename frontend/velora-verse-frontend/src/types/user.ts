/**
 * User types for the storefront frontend.
 *
 * The actual User DocType is part of core Frappe. These types represent
 * the subset of user fields exposed via the auth/profile API endpoints.
 */

export interface User {
	/** User email (also the Frappe document name) */
	email: string;
	/** Full display name */
	full_name: string;
	/** Phone number */
	phone?: string;
	/** URL to user avatar/profile image */
	user_image?: string;
	/** List of Frappe roles assigned to this user */
	roles?: string[];
}

/** Extended user profile returned by the profile endpoint. */
export interface UserProfile extends User {
	/** First name */
	first_name?: string;
	/** Last name */
	last_name?: string;
	/** List of Frappe roles assigned to this user */
	roles?: string[];
}

/** Credentials for login request. */
export interface LoginCredentials {
	usr: string;
	pwd: string;
}

/** Payload for user registration. */
export interface RegisterPayload {
	email: string;
	full_name: string;
	password: string;
	phone?: string;
}

/** Response from a successful login. */
export interface LoginResponse {
	message: string;
	home_page: string;
	full_name: string;
}
