export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CATEGORIES: "/categories",
  CATEGORY_DETAIL: (slug: string) => `/categories/${slug}`,
  SEARCH: "/search",
  BUNDLES: "/bundles",
  BUNDLE_DETAIL: (slug: string) => `/bundles/${slug}`,
  PROMOTIONS: "/promotions",
  PROMOTION_DETAIL: (id: string) => `/promotions/${id}`,
  GIFT_CARDS: "/gift-cards",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: (id: string) => `/order-confirmation/${id}`,
  PROFILE: "/profile",
  ADDRESSES: "/addresses",
  ORDERS: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  WISHLIST: "/wishlist",
  RETURNS: "/returns",
  NEW_RETURN: "/returns/new",
  LOYALTY: "/loyalty",
  MY_GIFT_CARDS: "/my-gift-cards",
  NOTIFICATIONS: "/notifications",
  SHIPPING_INFO: "/shipping-info",
  RETURNS_POLICY: "/returns-policy",
  ABOUT: "/about",
  CONTACT: "/contact",
  FAQ: "/faq",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS: "/terms",
  DASHBOARD: "/admin/dashboard",
} as const;

export const AUTH_ROUTES = [
  "/profile",
  "/addresses",
  "/orders",
  "/wishlist",
  "/returns",
  "/loyalty",
  "/my-gift-cards",
  "/notifications",
  "/checkout",
] as const;

export const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"] as const;

export const SORT_OPTIONS = [
  { label: "Newest", value: "creation:desc" },
  { label: "Price: Low to High", value: "base_price:asc" },
  { label: "Price: High to Low", value: "base_price:desc" },
  { label: "Rating", value: "average_rating:desc" },
  { label: "Popularity", value: "review_count:desc" },
] as const;

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export const PAGE_SIZE = 12;
