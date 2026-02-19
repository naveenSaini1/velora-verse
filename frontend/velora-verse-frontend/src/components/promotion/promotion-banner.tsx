import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FrappeImage } from "@/components/shared/frappe-image";
import { ROUTES } from "@/lib/utils/constants";
import { CountdownTimer } from "./countdown-timer";
import type { Promotion } from "@/types/promotion";

interface PromotionBannerProps {
  promotion: Promotion;
}

export function PromotionBanner({ promotion }: PromotionBannerProps) {
  return (
    <Link href={ROUTES.PROMOTION_DETAIL(promotion.name)}>
      <div className="relative overflow-hidden rounded-lg group">
        {promotion.banner_image ? (
          <div className="relative aspect-[3/1]">
            <FrappeImage
              src={promotion.banner_image}
              alt={promotion.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[3/1] bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="destructive">
              {promotion.discount_type === "Percentage"
                ? `${promotion.discount_value}% OFF`
                : `Flat ₹${promotion.discount_value} OFF`}
            </Badge>
            {promotion.badge_text && (
              <Badge variant="secondary">{promotion.badge_text}</Badge>
            )}
          </div>
          <h3 className="text-lg font-bold">{promotion.title}</h3>
          {promotion.end_date && (
            <CountdownTimer endDate={promotion.end_date} className="mt-1" />
          )}
        </div>
      </div>
    </Link>
  );
}
