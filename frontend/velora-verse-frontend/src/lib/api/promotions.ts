import { frappeGet } from "./client";
import type { Promotion } from "@/types/promotion";
import type { ProductListItem } from "@/types/product";

interface BackendPromotion {
  name: string;
  promotion_title: string;
  discount_type: string;
  discount_value: number;
  start_datetime: string;
  end_datetime: string;
  badge_text?: string;
  banner_image?: string;
  apply_to: string;
  priority_level: number;
  item_count?: number;
}

function mapPromotion(p: BackendPromotion): Promotion {
  return {
    name: p.name,
    title: p.promotion_title,
    discount_type: p.discount_type as Promotion["discount_type"],
    discount_value: p.discount_value,
    start_date: p.start_datetime,
    end_date: p.end_datetime,
    is_active: true, // Only active promotions are returned
    priority_level: p.priority_level,
    apply_to: p.apply_to as Promotion["apply_to"],
    max_quantity_per_user: 0,
    total_stock_limit: 0,
    badge_text: p.badge_text,
    banner_image: p.banner_image,
    items: [],
  };
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const result = await frappeGet<{ promotions: BackendPromotion[] }>(
    "velora_verse.api.promotions.get_active_promotions"
  );
  return result.promotions.map(mapPromotion);
}

export async function getFlashSaleProducts(promotion_id: string) {
  return frappeGet<{
    products: ProductListItem[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    promotion: {
      name: string;
      title: string;
      badge_text?: string;
      end_datetime: string;
    } | null;
  }>("velora_verse.api.promotions.get_flash_sale_products", { promotion: promotion_id });
}
