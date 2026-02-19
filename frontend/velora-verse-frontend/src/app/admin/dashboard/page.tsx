"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  Tag,
  Gift,
  Star,
  ArrowLeft,
  RefreshCw,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { motion } from "framer-motion";
import { getDashboardStats, getRevenueChart, getOrderFunnel } from "@/lib/api/dashboard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { formatCurrency } from "@/lib/utils/format-currency";
import { ROUTES } from "@/lib/utils/constants";
import { AnimatedCounter } from "@/components/motion/animated-counter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import type {
  DashboardStats,
  RevenueChart as RevenueChartData,
  OrderFunnel as OrderFunnelData,
  DashboardPeriod,
} from "@/types/dashboard";

const ADMIN_ROLES = ["Administrator", "System Manager", "Store Admin"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600",
  Confirmed: "bg-blue-500/10 text-blue-600",
  Processing: "bg-blue-500/10 text-blue-600",
  Shipped: "bg-violet-500/10 text-violet-600",
  Delivered: "bg-emerald-500/10 text-emerald-600",
  Cancelled: "bg-red-500/10 text-red-600",
  Returned: "bg-muted text-muted-foreground",
};

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const user = useAuthStore((s) => s.user);

  // Resolve CSS variable for recharts SVG elements
  const [chartColor, setChartColor] = useState("#6366f1");
  useEffect(() => {
    function resolve() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      if (raw) setChartColor(raw);
    }
    resolve();
    // Re-resolve when theme changes (class toggle on <html>)
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [period, setPeriod] = useState<DashboardPeriod>("monthly");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData | null>(null);
  const [funnelData, setFunnelData] = useState<OrderFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.roles?.some((r) => ADMIN_ROLES.includes(r)) ?? false;

  const fetchData = useCallback(async (p: DashboardPeriod, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Pick appropriate grouping for the chart based on the selected period
    const groupBy = p === "daily" || p === "weekly" ? "day" : p === "yearly" ? "month" : "day";

    try {
      const [statsRes, chartRes, funnelRes] = await Promise.all([
        getDashboardStats(p).catch(() => null),
        getRevenueChart(p, groupBy).catch(() => null),
        getOrderFunnel().catch(() => null),
      ]);
      setStats(statsRes);
      setChartData(chartRes);
      setFunnelData(funnelRes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    fetchData(period);
  }, [authLoading, isAdmin, period, fetchData, router]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (!stats) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
        <Button onClick={() => fetchData(period)} className="mt-4 rounded-xl">
          Try Again
        </Button>
      </div>
    );
  }

  const revenueChartItems = chartData
    ? chartData.labels.map((label, i) => ({
        date: label,
        revenue: chartData.revenue[i],
        orders: chartData.order_count[i],
      }))
    : [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-3 mb-1 rounded-xl" asChild>
            <Link href={ROUTES.PROFILE}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Account
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Store overview for the{" "}
            {period === "daily" ? "last 24 hours" : `last ${period.replace("ly", "")}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
            <TabsList className="rounded-xl bg-secondary/50">
              <TabsTrigger value="daily" className="rounded-lg text-xs">Day</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-lg text-xs">Week</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg text-xs">Month</TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-lg text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => fetchData(period, true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenue"
          rawValue={stats.revenue}
          formatFn={formatCurrency}
          icon={DollarSign}
          accent="text-emerald-600"
          index={0}
        />
        <KPICard
          title="Orders"
          rawValue={stats.order_count}
          icon={ShoppingCart}
          accent="text-blue-600"
          index={1}
        />
        <KPICard
          title="Avg Order Value"
          rawValue={stats.avg_order_value}
          formatFn={formatCurrency}
          icon={TrendingUp}
          accent="text-violet-600"
          index={2}
        />
        <KPICard
          title="New Customers"
          rawValue={stats.new_customers}
          icon={Users}
          accent="text-amber-600"
          index={3}
        />
      </div>

      {/* Revenue Chart */}
      {revenueChartItems.length > 0 && (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartItems}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => {
                      // Handle both YYYY-MM-DD (day) and YYYY-MM (month) formats
                      const d = new Date(v);
                      if (isNaN(d.getTime())) return v;
                      // Month grouping: show "Jan", "Feb", etc.
                      if (String(v).length <= 7) {
                        return d.toLocaleString("en-IN", { month: "short" });
                      }
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      fontSize: "13px",
                    }}
                    formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Tables */}
        <div className="space-y-6 lg:col-span-2">
          {/* Orders by Status */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.orders_by_status.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders in this period.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stats.orders_by_status.map((s) => (
                    <Badge
                      key={s.status}
                      variant="secondary"
                      className={`${STATUS_COLORS[s.status] || "bg-muted text-muted-foreground"} rounded-full px-3 py-1.5 text-xs font-medium`}
                    >
                      {s.status}: {s.count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.top_products.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No sales data yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {stats.top_products.map((p, i) => (
                    <div key={p.item_name} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium leading-snug">{p.item_name}</p>
                          <p className="text-xs text-muted-foreground">{p.total_qty} sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          {stats.payment_breakdown.length > 0 && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.payment_breakdown.map((pm) => {
                    const pct = stats.order_count > 0 ? (pm.count / stats.order_count) * 100 : 0;
                    return (
                      <div key={pm.payment_method}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{pm.payment_method || "N/A"}</span>
                          <span className="text-muted-foreground">
                            {pm.count} orders ({formatCurrency(pm.total_amount)})
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Alerts & Stats */}
        <div className="space-y-6">
          {/* Conversion Funnel */}
          {funnelData && funnelData.funnel.length > 0 && (() => {
            const maxCount = Math.max(...funnelData.funnel.map((s) => s.count), 1);
            return (
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {funnelData.funnel.map((step, i) => {
                    const pct = Math.min((step.count / maxCount) * 100, 100);
                    return (
                      <div key={step.stage}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{step.stage}</span>
                          <span className="font-semibold">{step.count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        {i < funnelData.funnel.length - 1 && funnelData.funnel[i].count > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                            {((funnelData.funnel[i + 1].count / funnelData.funnel[i].count) * 100).toFixed(1)}% conversion
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Low Stock Alerts */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock ({stats.low_stock_variants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.low_stock_variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">All stock levels healthy.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.low_stock_variants.map((v) => (
                    <div key={v.name} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{v.item_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.title}</p>
                      </div>
                      <Badge variant="destructive" className="rounded-full ml-2 shrink-0">
                        {v.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickStat icon={Package} label="Pending Returns" value={stats.pending_returns} />
              <QuickStat icon={Tag} label="Active Promotions" value={stats.active_promotions} />
              <Separator />
              <QuickStat icon={Gift} label="Active Gift Cards" value={stats.gift_card_stats.active} />
              <div className="flex justify-between text-xs text-muted-foreground pl-8">
                <span>Issued: {formatCurrency(stats.gift_card_stats.total_issued)}</span>
                <span>Redeemed: {formatCurrency(stats.gift_card_stats.total_redeemed)}</span>
              </div>
              <Separator />
              <QuickStat icon={Star} label="Loyalty Points Earned" value={stats.loyalty_stats.total_earned.toLocaleString()} />
              <div className="flex justify-between text-xs text-muted-foreground pl-8">
                <span>Redeemed: {stats.loyalty_stats.total_redeemed.toLocaleString()} pts</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Segments */}
          {stats.customer_segments.length > 0 && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Customer Segments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {stats.customer_segments.map((seg) => (
                  <div key={seg.segment_name} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{seg.segment_name}</p>
                      <p className="text-xs text-muted-foreground">{seg.member_count} members</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {seg.discount_percentage}% off
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KPICard({
  title,
  rawValue,
  formatFn,
  icon: Icon,
  accent,
  index = 0,
}: {
  title: string;
  rawValue: number;
  formatFn?: (n: number) => string;
  icon: React.ElementType;
  accent: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                <AnimatedCounter
                  value={rawValue}
                  formatFn={formatFn ?? ((n) => Math.round(n).toLocaleString("en-IN"))}
                  duration={1}
                />
              </p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-secondary ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-24 rounded-xl bg-muted" />
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-[340px] rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
