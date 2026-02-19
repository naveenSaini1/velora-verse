import { frappeGet } from "./client";
import type {
	DashboardStats,
	RevenueChart,
	OrderFunnel,
	DashboardPeriod,
} from "@/types/dashboard";

export async function getDashboardStats(
	period: DashboardPeriod = "monthly"
): Promise<DashboardStats> {
	return frappeGet<DashboardStats>(
		"velora_verse.api.dashboard.get_dashboard_stats",
		{ period }
	);
}

export async function getRevenueChart(
	period: string = "monthly",
	group_by: string = "day"
): Promise<RevenueChart> {
	return frappeGet<RevenueChart>(
		"velora_verse.api.dashboard.get_revenue_chart",
		{ period, group_by }
	);
}

export async function getOrderFunnel(): Promise<OrderFunnel> {
	return frappeGet<OrderFunnel>(
		"velora_verse.api.dashboard.get_order_funnel"
	);
}
