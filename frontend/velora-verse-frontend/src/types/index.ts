/**
 * Velora Verse frontend type definitions.
 *
 * Re-exports all types from domain-specific modules for convenient
 * single-import usage: `import { Product, Cart, Order } from "@/types"`.
 */

// Generic API types
export type {
	FrappeResponse,
	ApiError,
	PaginatedResponse,
	PaginationParams,
	FrappeRecord,
} from "./api";

// Product & catalog types
export type {
	Product,
	ProductListItem,
	ProductImage,
	ProductCategory,
	ProductVariant,
	VariantValue,
	ProductFilter,
	ProductFilterOption,
	ProductListParams,
	CategoryTree,
} from "./product";

// Cart types
export type { Cart, CartItem } from "./cart";

// Order types
export type {
	Order,
	OrderItem,
	OrderStatus,
	PaymentStatus,
} from "./order";

// User types
export type {
	User,
	UserProfile,
	LoginCredentials,
	RegisterPayload,
	LoginResponse,
} from "./user";

// Address types
export type {
	Address,
	AddressType,
	AddressPayload,
} from "./address";

// Review types
export type {
	Review,
	ReviewPayload,
	ReviewSummary,
} from "./review";

// Promotion types
export type {
	Promotion,
	PromotionItem,
	DiscountType,
	PromotionApplyTo,
} from "./promotion";

// Bundle types
export type { Bundle, BundleItem } from "./bundle";

// Gift Card types
export type {
	GiftCard,
	GiftCardTransaction,
	GiftCardStatus,
	GiftCardTransactionType,
	GiftCardPurchasePayload,
	GiftCardRedeemPayload,
} from "./gift-card";

// Loyalty types
export type {
	LoyaltyBalance,
	LoyaltyTransaction,
	LoyaltyTransactionType,
} from "./loyalty";

// Notification types
export type {
	UserNotification,
	NotificationType,
	NotificationCounts,
} from "./notification";

// Return types
export type {
	ReturnRequest,
	ReturnItem,
	ReturnRequestPayload,
	ReturnStatus,
	ReturnType,
	ReturnReason,
	RefundMethod,
} from "./return";

// Store Settings types
export type { StoreSettings } from "./store-settings";
