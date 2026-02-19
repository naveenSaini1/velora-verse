"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { getLoyaltyBalance, getLoyaltyHistory } from "@/lib/api/loyalty";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

import type {
  LoyaltyBalance,
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from "@/types/loyalty";

const TYPE_CONFIG: Record<
  LoyaltyTransactionType,
  {
    icon: React.ComponentType<{ className?: string }>;
    sign: "+" | "-";
  }
> = {
  Earn: { icon: TrendingUp, sign: "+" },
  Redeem: { icon: TrendingDown, sign: "-" },
  Expiry: { icon: Clock, sign: "-" },
  Adjustment: { icon: Settings, sign: "+" },
  Refund: { icon: RefreshCw, sign: "+" },
};

export default function LoyaltyPage() {
  const { isLoading: authLoading } = useRequireAuth();

  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchData();
  }, [authLoading]);

  async function fetchData() {
    try {
      setLoading(true);
      const [balanceData, historyData] = await Promise.all([
        getLoyaltyBalance(),
        getLoyaltyHistory({ page: 1, limit: 20 }),
      ]);
      setBalance(balanceData);
      setTransactions(historyData.entries ?? []);
      setHasNext((historyData.page ?? 1) < (historyData.total_pages ?? 1));
      setPage(1);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load loyalty data");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await getLoyaltyHistory({ page: nextPage, limit: 20 });
      setTransactions((prev) => [...prev, ...(data.entries ?? [])]);
      setHasNext((data.page ?? nextPage) < (data.total_pages ?? 1));
      setPage(nextPage);
    } catch (err) {
      toast.error("Failed to load more transactions");
    } finally {
      setLoadingMore(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loyalty Points</h1>
        <p className="text-muted-foreground">
          Track your points earnings and redemptions
        </p>
      </div>

      {/* Balance Card */}
      {balance && (
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-primary/8 to-primary/5 shadow-sm">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  Available Points
                </p>
                <p className="text-3xl font-bold text-primary">
                  {balance.available_points.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Worth {formatCurrency(balance.currency_value)}
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-semibold">
                  {balance.total_points.toLocaleString()}
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Pending Points</p>
                <p className="text-2xl font-semibold">
                  {balance.pending_points.toLocaleString()}
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Point Value</p>
                <p className="text-2xl font-semibold">
                  {balance.available_points > 0
                    ? formatCurrency(
                        balance.currency_value / balance.available_points
                      )
                    : formatCurrency(0)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / point
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>Your loyalty points activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Star className="h-12 w-12" />}
                title="No transactions yet"
                description="Start shopping to earn loyalty points"
                actionLabel="Browse Products"
                actionHref={ROUTES.PRODUCTS}
              />
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                {transactions.map((txn) => {
                  const config = TYPE_CONFIG[txn.transaction_type];
                  const Icon = config.icon;
                  const isPositive = txn.points > 0;

                  return (
                    <div
                      key={txn.name}
                      className="flex items-center gap-4 px-4 py-3 sm:px-6"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          isPositive
                            ? "bg-emerald-500/10"
                            : "bg-red-500/10"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {txn.transaction_type}
                          </span>
                          {!!txn.is_expired && (
                            <Badge
                              className="rounded-full text-xs bg-red-500/10 text-red-600 dark:text-red-400"
                              variant="secondary"
                            >
                              Expired
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(txn.creation)}
                          {(txn.reference_name || txn.order) && (
                            <>
                              {" "}
                              &middot;{" "}
                              <Link
                                href={ROUTES.ORDER_DETAIL(
                                  txn.reference_name || txn.order || ""
                                )}
                                className="text-primary hover:underline"
                              >
                                {txn.reference_name || txn.order}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {txn.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {txn.running_balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasNext && (
                <div className="flex justify-center p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
