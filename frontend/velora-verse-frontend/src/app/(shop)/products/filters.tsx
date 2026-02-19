"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ProductFilter } from "@/types/product";

interface FilterProps {
  filters: ProductFilter[];
  activeCategory?: string;
  activeMinPrice?: number;
  activeMaxPrice?: number;
  activeInStock: boolean;
  activeIsFeatured: boolean;
}

export function ProductFilters({
  filters,
  activeCategory,
  activeMinPrice,
  activeMaxPrice,
  activeInStock,
  activeIsFeatured,
}: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    const sortBy = searchParams.get("sort_by");
    const sortOrder = searchParams.get("sort_order");
    if (sortBy) params.set("sort_by", sortBy);
    if (sortOrder) params.set("sort_order", sortOrder);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const categoryFilter = filters.find((f) => f.field === "category");
  const priceFilter = filters.find((f) => f.field === "base_price");

  const priceMin = priceFilter?.options?.[0]
    ? Number(priceFilter.options[0].value)
    : 0;
  const priceMax = priceFilter?.options?.[1]
    ? Number(priceFilter.options[1].value)
    : 50000;

  const hasActiveFilters = activeCategory || activeMinPrice || activeMaxPrice || activeInStock || activeIsFeatured;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Category filter */}
      {categoryFilter && categoryFilter.options.length > 0 && (
        <Accordion type="single" collapsible defaultValue="categories">
          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={activeCategory ?? ""}
                onValueChange={(value) => {
                  updateParams("category", value || undefined);
                }}
                className="flex flex-col gap-2 pt-1"
              >
                {categoryFilter.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="flex-1">{option.label}</span>
                    {option.count != null && (
                      <span className="text-xs text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>
              {activeCategory && (
                <button
                  className="mt-2 text-xs text-primary hover:underline"
                  onClick={() => updateParams("category", undefined)}
                >
                  Clear category
                </button>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <Separator />

      {/* Price range */}
      <PriceRangeFilter
        min={priceMin}
        max={priceMax}
        activeMin={activeMinPrice}
        activeMax={activeMaxPrice}
        onCommit={(min, max) => {
          const params = new URLSearchParams(searchParams.toString());
          if (min > priceMin) {
            params.set("min_price", String(min));
          } else {
            params.delete("min_price");
          }
          if (max < priceMax) {
            params.set("max_price", String(max));
          } else {
            params.delete("max_price");
          }
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
      />

      <Separator />

      {/* In stock toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock" className="text-sm font-medium">
          In Stock Only
        </Label>
        <Switch
          id="in-stock"
          checked={activeInStock}
          onCheckedChange={(checked) => {
            updateParams("in_stock", checked ? "true" : undefined);
          }}
        />
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="is-featured" className="text-sm font-medium">
          Featured Only
        </Label>
        <Switch
          id="is-featured"
          checked={activeIsFeatured}
          onCheckedChange={(checked) => {
            updateParams("is_featured", checked ? "true" : undefined);
          }}
        />
      </div>
    </div>
  );
}

function PriceRangeFilter({
  min,
  max,
  activeMin,
  activeMax,
  onCommit,
}: {
  min: number;
  max: number;
  activeMin?: number;
  activeMax?: number;
  onCommit: (min: number, max: number) => void;
}) {
  const [range, setRange] = useState<[number, number]>([
    activeMin ?? min,
    activeMax ?? max,
  ]);

  // Sync range when filters are cleared externally
  useEffect(() => {
    setRange([activeMin ?? min, activeMax ?? max]);
  }, [activeMin, activeMax, min, max]);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Price Range</span>
      <Slider
        min={min}
        max={max}
        step={100}
        value={range}
        onValueChange={(v) => setRange(v as [number, number])}
        onValueCommit={(v) => onCommit(v[0], v[1])}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>₹{range[0].toLocaleString("en-IN")}</span>
        <span>₹{range[1].toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

interface MobileFilterSheetProps extends FilterProps {
  activeFilterCount: number;
}

export function MobileFilterSheet(props: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {props.activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {props.activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <ProductFilters
            filters={props.filters}
            activeCategory={props.activeCategory}
            activeMinPrice={props.activeMinPrice}
            activeMaxPrice={props.activeMaxPrice}
            activeInStock={props.activeInStock}
            activeIsFeatured={props.activeIsFeatured}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
