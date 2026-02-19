import type { Metadata } from "next";
import Link from "next/link";
import { getBundles } from "@/lib/api/bundles";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/utils/constants";
import { ScrollReveal } from "@/components/animations";
import { Package } from "lucide-react";
import type { Bundle } from "@/types/bundle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bundles",
  description:
    "Save more with our curated product bundles at Velora Verse.",
};

export default async function BundlesPage() {
  let bundles: Bundle[] = [];

  try {
    const result = await getBundles();
    bundles = Array.isArray(result) ? result : [];
  } catch {
    // Render with empty state
  }

  const activeBundles = bundles.filter((b) => b.is_active);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Bundles" },
        ]}
        className="mb-4"
      />

      <ScrollReveal direction="up" duration={0.5}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Product Bundles
        </h1>
        <p className="text-muted-foreground mb-8">
          Get more value with our specially curated bundles. Buy together and save!
        </p>
      </ScrollReveal>

      {activeBundles.length > 0 ? (
        <ScrollReveal direction="up" delay={0.15} duration={0.6}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeBundles.map((bundle) => (
            <BundleCard key={bundle.name} bundle={bundle} />
          ))}
        </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal direction="up" duration={0.5}>
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No bundles available"
          description="Check back soon for our curated product bundles."
          actionLabel="Browse Products"
          actionHref={ROUTES.PRODUCTS}
        />
        </ScrollReveal>
      )}
    </div>
  );
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  const slug = bundle.slug || bundle.name;

  return (
    <Link href={ROUTES.BUNDLE_DETAIL(slug)}>
      <Card className="group overflow-hidden rounded-2xl border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-200 h-full">
        {/* Bundle image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <FrappeImage
            src={bundle.image}
            alt={bundle.bundle_name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Savings badge */}
          {bundle.savings_percent > 0 && (
            <Badge
              className="absolute top-3 right-3 text-sm font-bold rounded-full bg-primary text-primary-foreground"
            >
              Save {Math.round(bundle.savings_percent)}%
            </Badge>
          )}
        </div>

        <CardContent className="p-4 flex flex-col gap-2">
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200 line-clamp-1">
            {bundle.bundle_name}
          </h2>

          {bundle.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {bundle.description}
            </p>
          )}

          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {bundle.bundle_items.length}{" "}
              {bundle.bundle_items.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          {/* Pricing */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Currency
              amount={bundle.bundle_price}
              className="text-lg font-bold text-foreground"
            />
            {bundle.savings > 0 && (
              <Currency
                amount={bundle.total_price}
                className="text-sm text-muted-foreground line-through"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
