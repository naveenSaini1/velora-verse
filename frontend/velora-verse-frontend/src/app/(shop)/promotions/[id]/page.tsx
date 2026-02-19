import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFlashSaleProducts } from "@/lib/api/promotions";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { FrappeImage } from "@/components/shared/frappe-image";
import { Currency } from "@/components/shared/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/utils/constants";
import { Tag } from "lucide-react";
import type { ProductListItem } from "@/types/product";
import { CountdownTimer } from "@/components/promotion/countdown-timer";

interface PromotionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PromotionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await getFlashSaleProducts(id);
    const promotion = data.promotion;
    if (!promotion) return { title: "Promotion Not Found" };
    return {
      title: promotion.title,
      description: `Shop the ${promotion.title} promotion at Velora Verse.`,
    };
  } catch {
    return { title: "Promotion Not Found" };
  }
}

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getFlashSaleProducts>>;

  try {
    data = await getFlashSaleProducts(id);
  } catch {
    notFound();
  }

  const { promotion, products } = data;

  if (!promotion) {
    notFound();
  }

  const badgeLabel = promotion.badge_text || "SALE";

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Promotions", href: ROUTES.PROMOTIONS },
          { label: promotion.title },
        ]}
        className="mb-6"
      />

      {/* Promotion header */}
      <div className="mb-8 overflow-hidden rounded-xl border">
        <div className="bg-gradient-to-br from-primary/10 to-accent p-8">
          <Badge className="mb-3 text-sm font-bold rounded-full bg-primary text-primary-foreground">
            {badgeLabel}
          </Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {promotion.title}
          </h1>
        </div>
      </div>

      {/* Countdown timer */}
      <div className="mb-8 flex justify-center">
        <CountdownTimer endDate={promotion.end_datetime} />
      </div>

      {/* Product grid for promoted items */}
      {products.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <PromotionProductCard
              key={product.name}
              product={product}
              badgeLabel={badgeLabel}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="No products in this promotion"
          description="This promotion may have ended or products are being updated."
          actionLabel="Browse All Products"
          actionHref={ROUTES.PRODUCTS}
        />
      )}
    </div>
  );
}

function PromotionProductCard({
  product,
  badgeLabel,
}: {
  product: ProductListItem & {
    sale_price?: number;
    discount_badge?: string;
    promotion_name?: string;
    image_alt?: string;
  };
  badgeLabel: string;
}) {
  const slug = product.slug || product.name;
  const image = product.image;

  return (
    <Link href={slug ? ROUTES.PRODUCT_DETAIL(slug) : ROUTES.PRODUCTS}>
      <Card className="group overflow-hidden rounded-2xl border-transparent hover:border-primary/20 p-0 gap-0 hover:shadow-md transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <FrappeImage
            src={image}
            alt={product.item_name || "Promotion item"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          <Badge
            className="absolute top-2 left-2 text-xs rounded-full bg-primary text-primary-foreground"
          >
            {product.discount_badge || badgeLabel}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-3 flex flex-col gap-1.5">
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {product.item_name || "Product"}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {product.sale_price != null && (
              <Currency
                amount={product.sale_price}
                className="text-lg font-bold text-foreground"
              />
            )}
            {product.base_price != null &&
              product.sale_price != null &&
              product.base_price > product.sale_price && (
                <Currency
                  amount={product.base_price}
                  className="text-sm text-muted-foreground line-through"
                />
              )}
            {product.sale_price == null && product.base_price != null && (
              <Currency
                amount={product.base_price}
                className="text-lg font-bold text-foreground"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
