/** Dashboard API response types matching the backend endpoints. */

export interface OrdersByStatus {
	status: string;
	count: number;
}

export interface TopProduct {
	item_name: string;
	revenue: number;
	total_qty: number;
}

export interface PaymentBreakdown {
	payment_method: string;
	count: number;
	total_amount: number;
}

export interface LowStockVariant {
	name: string;
	title: string;
	quantity: number;
	item_name: string;
}

export interface GiftCardStats {
	total: number;
	active: number;
	total_issued: number;
	total_redeemed: number;
}

export interface LoyaltyStats {
	total_earned: number;
	total_redeemed: number;
}

export interface CustomerSegment {
	segment_name: string;
	discount_percentage: number;
	member_count: number;
}

export interface DashboardStats {
	revenue: number;
	order_count: number;
	avg_order_value: number;
	new_customers: number;
	orders_by_status: OrdersByStatus[];
	top_products: TopProduct[];
	payment_breakdown: PaymentBreakdown[];
	low_stock_variants: LowStockVariant[];
	pending_returns: number;
	active_promotions: number;
	gift_card_stats: GiftCardStats;
	loyalty_stats: LoyaltyStats;
	customer_segments: CustomerSegment[];
	period: string;
}

export interface RevenueChart {
	labels: string[];
	revenue: number[];
	order_count: number[];
}

export interface FunnelStep {
	stage: string;
	count: number;
}

export interface OrderFunnel {
	funnel: FunnelStep[];
}

export type DashboardPeriod = "daily" | "weekly" | "monthly" | "yearly";
