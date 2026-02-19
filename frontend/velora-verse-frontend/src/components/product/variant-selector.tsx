"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (v: ProductVariant) => void;
}

interface PropertyGroup {
  propertyName: string;
  values: Array<{
    value: string;
    available: boolean;
  }>;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
}: VariantSelectorProps) {
  const propertyGroups = useMemo(() => {
    const groupMap = new Map<string, Set<string>>();

    for (const variant of variants) {
      for (const prop of variant.variant_values) {
        if (!groupMap.has(prop.type)) {
          groupMap.set(prop.type, new Set());
        }
        groupMap.get(prop.type)!.add(prop.value);
      }
    }

    const groups: PropertyGroup[] = [];

    for (const [propertyName, valuesSet] of groupMap) {
      const values = Array.from(valuesSet).map((value) => {
        const available = variants.some(
          (v) =>
            v.is_stock &&
            v.variant_values.some(
              (p) => p.type === propertyName && p.value === value
            )
        );

        return { value, available };
      });

      groups.push({ propertyName, values });
    }

    return groups;
  }, [variants]);

  const selectedValues = useMemo(() => {
    if (!selectedVariant) return new Map<string, string>();

    const map = new Map<string, string>();
    for (const prop of selectedVariant.variant_values) {
      map.set(prop.type, prop.value);
    }
    return map;
  }, [selectedVariant]);

  const handleOptionClick = (propertyName: string, value: string) => {
    const targetProps = new Map(selectedValues);
    targetProps.set(propertyName, value);

    const match = variants.find((v) =>
      Array.from(targetProps).every(([key, val]) =>
        v.variant_values.some((p) => p.type === key && p.value === val)
      )
    );

    if (match) {
      onSelect(match);
      return;
    }

    const fallback = variants.find((v) =>
      v.variant_values.some(
        (p) => p.type === propertyName && p.value === value
      )
    );

    if (fallback) {
      onSelect(fallback);
    }
  };

  const isOptionAvailable = (propertyName: string, value: string): boolean => {
    const targetProps = new Map(selectedValues);
    targetProps.set(propertyName, value);

    return variants.some(
      (v) =>
        v.is_stock &&
        Array.from(targetProps).every(([key, val]) =>
          v.variant_values.some((p) => p.type === key && p.value === val)
        )
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {propertyGroups.map((group) => (
        <div key={group.propertyName} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {group.propertyName}
            {selectedValues.has(group.propertyName) && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                : {selectedValues.get(group.propertyName)}
              </span>
            )}
          </span>

          <div className="flex flex-wrap gap-2">
            {group.values.map(({ value }) => {
              const isSelected =
                selectedValues.get(group.propertyName) === value;
              const available = isOptionAvailable(group.propertyName, value);

              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  onClick={() => handleOptionClick(group.propertyName, value)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                        ? "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30"
                        : "border-border/50 bg-muted text-muted-foreground/50 line-through cursor-not-allowed"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="flex items-center gap-2">
          {selectedVariant.is_stock ? (
            <Badge variant="secondary" className="text-xs rounded-full">
              In Stock ({selectedVariant.quantity} available)
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs rounded-full">
              Out of Stock
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
