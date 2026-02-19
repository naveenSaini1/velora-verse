import { Card, CardContent } from "@/components/ui/card";
import { Currency } from "@/components/shared/currency";
import { Star } from "lucide-react";
import type { LoyaltyBalance } from "@/types/loyalty";

interface LoyaltyCardProps {
  balance: LoyaltyBalance;
}

export function LoyaltyCard({ balance }: LoyaltyCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-3xl font-bold">{balance.available_points.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Worth</p>
            <Currency amount={balance.currency_value} className="font-semibold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="font-semibold">{balance.total_points.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
