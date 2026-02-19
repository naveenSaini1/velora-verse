import type { Metadata } from "next";
import Link from "next/link";
import { getActivePromotions } from "@/lib/api/promotions";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/utils/constants";
import { ScrollReveal } from "@/components/animations";
import { Tag } from "lucide-react";
import type { Promotion } from "@/types/promotion";
import { CountdownTimer } from "@/components/promotion/countdown-timer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promotions",
  description:
    "Don't miss out on our active deals and flash sales at Velora Verse.",
};

export default async function PromotionsPage() {
  let promotions: Promotion[] = [];

  try {
    promotions = await getActivePromotions();
  } catch {
    // Render with empty state
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Promotions" },
        ]}
        className="mb-4"
      />

      <ScrollReveal direction="up" duration={0.5}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Active Promotions
        </h1>
        <p className="text-muted-foreground mb-8">
          Grab these deals before they expire!
        </p>
      </ScrollReveal>

      {promotions.length > 0 ? (
        <ScrollReveal direction="up" delay={0.15} duration={0.6}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <PromotionCard key={promo.name} promotion={promo} />
          ))}
        </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal direction="up" duration={0.5}>
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="No active promotions"
          description="Check back soon for amazing deals and flash sales."
          actionLabel="Browse Products"
          actionHref={ROUTES.PRODUCTS}
        />
        </ScrollReveal>
      )}
    </div>
  );
}

function PromotionCard({ promotion }: { promotion: Promotion }) {
  const discountLabel =
    promotion.discount_type === "Percentage"
      ? `${promotion.discount_value}% OFF`
      : promotion.discount_type === "Flat"
        ? `₹${promotion.discount_value} OFF`
        : `From ₹${promotion.discount_value}`;

  return (
    <Link href={ROUTES.PROMOTION_DETAIL(promotion.name)}>
      <Card className="group overflow-hidden rounded-2xl border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-200 h-full">
        {/* Banner image */}
        {promotion.banner_image ? (
          <div className="relative aspect-[2/1] overflow-hidden">
            <FrappeImage
              src={promotion.banner_image}
              alt={promotion.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <Badge
              className="absolute top-3 left-3 text-sm font-bold rounded-full bg-primary text-primary-foreground"
            >
              {promotion.badge_text || discountLabel}
            </Badge>
          </div>
        ) : (
          <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
            <Badge
              className="text-lg px-4 py-2 font-bold rounded-full bg-primary text-primary-foreground"
            >
              {promotion.badge_text || discountLabel}
            </Badge>
          </div>
        )}

        <CardContent className="p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200 line-clamp-1">
            {promotion.title}
          </h2>

          {promotion.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {promotion.description}
            </p>
          )}

          {/* Countdown */}
          <CountdownTimer endDate={promotion.end_date} />
        </CardContent>
      </Card>
    </Link>
  );
}
