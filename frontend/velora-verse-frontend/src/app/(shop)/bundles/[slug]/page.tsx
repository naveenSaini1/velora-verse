import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBundleDetail } from "@/lib/api/bundles";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/utils/constants";
import { resolveImageUrl } from "@/lib/utils/image-url";
import type { Bundle } from "@/types/bundle";
import { BundleAddToCart } from "./bundle-add-to-cart";
import { ShareButton } from "@/components/product/share-button";
import Link from "next/link";

interface BundleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BundleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const bundle = await getBundleDetail(slug);
    return {
      title: bundle.bundle_name,
      description:
        bundle.description ||
        `Get ${bundle.bundle_name} bundle and save ${Math.round(bundle.savings_percent)}% at Velora Verse.`,
      openGraph: {
        title: bundle.bundle_name,
        description:
          bundle.description ||
          `Save ${Math.round(bundle.savings_percent)}% with this bundle.`,
        images: bundle.image
          ? [{ url: resolveImageUrl(bundle.image) }]
          : undefined,
      },
    };
  } catch {
    return { title: "Bundle Not Found" };
  }
}

export default async function BundleDetailPage({
  params,
}: BundleDetailPageProps) {
  const { slug } = await params;

  let bundle: Bundle;
  try {
    bundle = await getBundleDetail(slug);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Bundles", href: ROUTES.BUNDLES },
          { label: bundle.bundle_name },
        ]}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Bundle image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          <FrappeImage
            src={bundle.image}
            alt={bundle.bundle_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {bundle.savings_percent > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-4 right-4 text-lg px-3 py-1 font-bold"
            >
              Save {Math.round(bundle.savings_percent)}%
            </Badge>
          )}
        </div>

        {/* Right: Bundle info */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {bundle.bundle_name}
            </h1>
            <ShareButton title={bundle.bundle_name} path={`/bundles/${slug}`} />
          </div>

          {bundle.description && (
            <p className="text-muted-foreground">{bundle.description}</p>
          )}

          {/* Pricing summary */}
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total if bought separately
              </span>
              <Currency
                amount={bundle.total_price}
                className="line-through text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Bundle Price</span>
              <Currency
                amount={bundle.bundle_price}
                className="text-2xl font-bold text-primary"
              />
            </div>
            {bundle.savings > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-green-600 dark:text-green-400">
                  You Save
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  <Currency amount={bundle.savings} /> (
                  {Math.round(bundle.savings_percent)}%)
                </span>
              </div>
            )}
          </div>

          {/* Add bundle to cart */}
          <BundleAddToCart bundle={bundle} />

          <Separator />

          {/* Items included */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Items Included ({bundle.bundle_items.length})
            </h2>
            <div className="flex flex-col gap-3">
              {bundle.bundle_items.map((item) => (
                <Card key={item.name} className="overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <FrappeImage
                        src={item.image}
                        alt={item.item_name || item.variant_title || "Bundle item"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.slug ? (
                        <Link
                          href={ROUTES.PRODUCT_DETAIL(item.slug)}
                          className="font-medium text-sm hover:underline line-clamp-1"
                        >
                          {item.item_name || item.variant_title}
                        </Link>
                      ) : (
                        <p className="font-medium text-sm line-clamp-1">
                          {item.item_name || item.variant_title}
                        </p>
                      )}
                      {item.variant_display && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant_display}
                        </p>
                      )}
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      )}
                    </div>
                    <Currency
                      amount={item.individual_price}
                      className="text-sm font-medium text-muted-foreground shrink-0"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
