import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { ROUTES } from "@/lib/utils/constants";
import type { Bundle } from "@/types/bundle";

interface BundleCardProps {
  bundle: Bundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  return (
    <Link href={ROUTES.BUNDLE_DETAIL(bundle.slug || bundle.name)}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="relative aspect-[4/3]">
          <FrappeImage
            src={bundle.image}
            alt={bundle.bundle_name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {bundle.savings_percent > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2"
            >
              Save {Math.round(bundle.savings_percent)}%
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1">{bundle.bundle_name}</h3>
          {bundle.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {bundle.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Currency
              amount={bundle.bundle_price}
              className="text-lg font-bold"
            />
            {bundle.total_price > bundle.bundle_price && (
              <Currency
                amount={bundle.total_price}
                className="text-sm text-muted-foreground line-through"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {bundle.bundle_items?.length || 0} items included
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
