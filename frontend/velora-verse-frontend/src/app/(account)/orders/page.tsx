"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { getOrders } from "@/lib/api/orders";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES, ORDER_STATUSES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

import type { Order, OrderStatus } from "@/types/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  Returned: "bg-muted text-muted-foreground",
};

export default function OrdersPage() {
  const { isLoading: authLoading } = useRequireAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    fetchOrders();
  }, [authLoading, statusFilter, page]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const params: { page: number; page_size: number; status?: string } = {
        page,
        page_size: 10,
      };
      if (statusFilter !== "All") {
        params.status = statusFilter;
      }
      const data = await getOrders(params);
      setOrders(data.items);
      setHasNext(data.has_next);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={handleStatusChange}>
        <TabsList className="h-auto flex-wrap rounded-xl bg-secondary/50">
          <TabsTrigger value="All" className="rounded-lg">
            All
          </TabsTrigger>
          {ORDER_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="rounded-lg">
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="No orders found"
          description={
            statusFilter === "All"
              ? "You haven't placed any orders yet"
              : `No ${statusFilter.toLowerCase()} orders`
          }
          actionLabel="Start Shopping"
          actionHref={ROUTES.PRODUCTS}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.name}
              className="rounded-2xl border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{order.name}</h3>
                      <Badge
                        className={STATUS_COLORS[order.status]}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on{" "}
                      {formatDate(order.order_date || order.creation)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.item_count ?? order.items?.length ?? 0} item
                      {(order.item_count ?? order.items?.length ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.payment_status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      asChild
                    >
                      <Link href={ROUTES.ORDER_DETAIL(order.name)}>View</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of{" "}
                {total} orders
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
