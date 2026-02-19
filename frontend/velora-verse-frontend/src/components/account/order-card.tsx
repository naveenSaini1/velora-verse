import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Currency } from "@/components/shared/currency";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format-date";
import { ChevronRight } from "lucide-react";
import type { Order } from "@/types/order";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Processing: "bg-purple-100 text-purple-800",
  Shipped: "bg-indigo-100 text-indigo-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Returned: "bg-gray-100 text-gray-800",
};

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{order.name}</span>
              <Badge
                variant="outline"
                className={statusColors[order.status] || ""}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(order.creation)}
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span>{order.items?.length || 0} item(s)</span>
              <Currency amount={order.total} className="font-semibold" />
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.ORDER_DETAIL(order.name)}>
              View <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
