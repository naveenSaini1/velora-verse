/**
 * Generic API response types for Frappe Framework backend communication.
 *
 * Frappe wraps all successful API responses in a `{ message: T }` envelope.
 * Error responses follow a separate structure with HTTP status and exception details.
 */

/** Standard Frappe API response wrapper. */
export interface FrappeResponse<T> {
	message: T;
}

/** Frappe API error shape returned on non-2xx responses. */
export interface ApiError {
	httpStatus: number;
	message: string;
	exception?: string;
	exc_type?: string;
	_server_messages?: string;
}

/** Paginated list response used by product listing and similar endpoints. */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	page_size: number;
	has_next: boolean;
}

/**
 * Raw paginated response shape from Frappe backend.
 * Backend returns `total_count`, `page`, `limit`, `total_pages`,
 * and a named array (e.g. `products`, `bundles`).
 */
export interface FrappePaginatedResponse {
	total_count: number;
	page: number;
	limit: number;
	total_pages: number;
}

/**
 * Convert a Frappe backend paginated response into the frontend PaginatedResponse shape.
 */
export function toPaginatedResponse<T>(
	items: T[],
	raw: FrappePaginatedResponse
): PaginatedResponse<T> {
	return {
		items,
		total: raw.total_count,
		page: raw.page,
		page_size: raw.limit,
		has_next: raw.page < raw.total_pages,
	};
}

/**
 * Parameters for paginated list requests.
 * Maps to the query parameters accepted by listing endpoints.
 */
export interface PaginationParams {
	page?: number;
	limit?: number;
	sort_by?: string;
	sort_order?: "asc" | "desc";
}

/** Generic key-value record returned by Frappe for counts, settings, etc. */
export type FrappeRecord = Record<string, unknown>;
