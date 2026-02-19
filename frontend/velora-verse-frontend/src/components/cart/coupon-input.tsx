"use client";

import { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateCoupon } from "@/lib/api/coupons";
import { formatDiscount } from "@/lib/utils/format-currency";

interface CouponInputProps {
  onApply: (code: string) => void;
  appliedCode?: string;
  onRemove?: () => void;
  orderTotal?: number;
}

export function CouponInput({
  onApply,
  appliedCode,
  onRemove,
  orderTotal = 0,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    discount_type: string;
    discount_value: number;
    calculated_discount: number;
  } | null>(null);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setError(null);
    setIsValidating(true);

    try {
      const result = await validateCoupon({
        coupon_code: trimmed,
      });

      if (result.valid) {
        setValidationResult({
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          calculated_discount: result.discount_amount,
        });
        onApply(trimmed);
        setCode("");
      } else {
        setError(result.message ?? "Invalid coupon code");
        setValidationResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate coupon");
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // Show applied state
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-700 dark:bg-emerald-950/50">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {appliedCode}
            </p>
            {validationResult && (
              <p className="text-xs text-green-600 dark:text-green-500">
                {formatDiscount(
                  validationResult.discount_type,
                  validationResult.discount_value
                )}
              </p>
            )}
          </div>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => {
              onRemove();
              setValidationResult(null);
            }}
            aria-label="Remove coupon"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code"
            aria-label="Coupon code"
            className="pl-9 rounded-xl"
            disabled={isValidating}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={!code.trim() || isValidating}
          variant="secondary"
          className="rounded-xl"
        >
          {isValidating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
