"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { getReturnRequests } from "@/lib/api/returns";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";

import type { ReturnRequest, ReturnStatus } from "@/types/return";

const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  "Refund Initiated":
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Refund Completed":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Closed: "bg-muted text-muted-foreground",
};

export default function ReturnsPage() {
  const { isLoading: authLoading } = useRequireAuth();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    fetchReturns();
  }, [authLoading]);

  async function fetchReturns() {
    try {
      setLoading(true);
      const data = await getReturnRequests();
      setReturns(data.return_requests ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load return requests");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
          <p className="text-muted-foreground">
            Manage your return and exchange requests
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href={ROUTES.NEW_RETURN}>
            <Plus className="mr-2 h-4 w-4" />
            Request a Return
          </Link>
        </Button>
      </div>

      {returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-12 w-12" />}
          title="No return requests"
          description="You haven't made any return or exchange requests"
        />
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <Card
              key={ret.name}
              className="rounded-2xl border-border/60 shadow-sm"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{ret.name}</h3>
                      <Badge
                        className={`rounded-full text-xs ${RETURN_STATUS_COLORS[ret.status]}`}
                        variant="secondary"
                      >
                        {ret.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full text-xs"
                      >
                        {ret.return_type}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>
                        Order:{" "}
                        <Link
                          href={ROUTES.ORDER_DETAIL(ret.order)}
                          className="text-primary hover:underline"
                        >
                          {ret.order}
                        </Link>
                      </p>
                      <p>
                        Requested on{" "}
                        {formatDate(ret.request_date || ret.creation)}
                      </p>
                      <p>
                        Reason: {ret.reason}
                        {ret.reason_detail && ` - ${ret.reason_detail}`}
                      </p>
                    </div>

                    {ret.items && ret.items.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {ret.items.length} item
                        {ret.items.length !== 1 ? "s" : ""} being returned
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(ret.refund_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ret.refund_method}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
