import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/components/shared/currency";
import { formatDate } from "@/lib/utils/format-date";
import { Gift } from "lucide-react";
import type { GiftCard } from "@/types/gift-card";

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  "Fully Redeemed": "bg-gray-100 text-gray-800",
  Expired: "bg-red-100 text-red-800",
  Deactivated: "bg-yellow-100 text-yellow-800",
};

interface GiftCardCardProps {
  giftCard: GiftCard;
}

export function GiftCardCard({ giftCard }: GiftCardCardProps) {
  const maskedCode = giftCard.card_code
    ? `****-****-${giftCard.card_code.slice(-4)}`
    : "****";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{maskedCode}</span>
              <Badge
                variant="outline"
                className={statusColors[giftCard.status] || ""}
              >
                {giftCard.status}
              </Badge>
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Balance: </span>
                <Currency amount={giftCard.balance} className="font-semibold" />
              </div>
              <div>
                <span className="text-muted-foreground">Initial: </span>
                <Currency amount={giftCard.initial_amount} />
              </div>
            </div>
            {giftCard.expires_on && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {formatDate(giftCard.expires_on)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
