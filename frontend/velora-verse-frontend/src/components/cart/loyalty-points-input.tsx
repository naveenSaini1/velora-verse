"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Currency } from "@/components/shared/currency";
import {
  getLoyaltyBalance,
  previewLoyaltyRedemption,
} from "@/lib/api/loyalty";
import type { LoyaltyBalance } from "@/types/loyalty";

interface LoyaltyPointsInputProps {
  orderTotal: number;
  onApply: (points: number, discount: number) => void;
  onRemove?: () => void;
}

export function LoyaltyPointsInput({
  orderTotal,
  onApply,
  onRemove,
}: LoyaltyPointsInputProps) {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [preview, setPreview] = useState<{
    discount: number;
    points_used: number;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [appliedRedemption, setAppliedRedemption] = useState<{
    points: number;
    discount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch loyalty balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await getLoyaltyBalance();
        setBalance(data);
      } catch {
        setError("Unable to load loyalty points");
      } finally {
        setIsLoadingBalance(false);
      }
    };
    fetchBalance();
  }, []);

  // Preview redemption when points change
  const fetchPreview = useCallback(
    async (points: number) => {
      if (points <= 0) {
        setPreview(null);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const data = await previewLoyaltyRedemption({
          points_to_redeem: points,
        });
        setPreview({
          discount: data.discount_amount,
          points_used: data.points_to_redeem,
        });
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to preview redemption"
        );
        setPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [orderTotal]
  );

  // Debounced preview on slider change
  useEffect(() => {
    if (appliedRedemption) return;

    const timer = setTimeout(() => {
      fetchPreview(pointsToRedeem);
    }, 300);

    return () => clearTimeout(timer);
  }, [pointsToRedeem, fetchPreview, appliedRedemption]);

  const handleApply = () => {
    if (!preview) return;
    setAppliedRedemption({
      points: preview.points_used,
      discount: preview.discount,
    });
    onApply(preview.points_used, preview.discount);
  };

  const handleRemove = () => {
    setAppliedRedemption(null);
    setPointsToRedeem(0);
    setPreview(null);
    onRemove?.();
  };

  const handlePointsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      setPointsToRedeem(0);
      return;
    }
    const clamped = Math.min(Math.max(0, value), balance?.available_points ?? 0);
    setPointsToRedeem(clamped);
  };

  // Loading state
  if (isLoadingBalance) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading loyalty points...</span>
      </div>
    );
  }

  // No points available
  if (!balance || balance.available_points <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
        <Award className="size-4" />
        <span>No loyalty points available</span>
      </div>
    );
  }

  // Applied state
  if (appliedRedemption) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {appliedRedemption.points.toLocaleString()} points redeemed
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Discount: <Currency amount={appliedRedemption.discount} />
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          aria-label="Remove loyalty points"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Balance display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-amber-500" />
          <span className="text-muted-foreground">Available Points</span>
        </div>
        <div className="text-right">
          <span className="font-semibold">
            {balance.available_points.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            (~<Currency amount={balance.currency_value} />)
          </span>
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={[pointsToRedeem]}
        onValueChange={([value]) => setPointsToRedeem(value)}
        min={0}
        max={balance.available_points}
        step={1}
      />

      {/* Points input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={pointsToRedeem || ""}
          onChange={handlePointsInputChange}
          min={0}
          max={balance.available_points}
          placeholder="0"
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">points</span>
        <div className="ml-auto">
          {isPreviewLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            preview && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                -<Currency amount={preview.discount} />
              </span>
            )
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Apply button */}
      <Button
        onClick={handleApply}
        disabled={!preview || pointsToRedeem <= 0}
        size="sm"
        variant="secondary"
        className="w-full"
      >
        Redeem {pointsToRedeem.toLocaleString()} Points
        {preview && (
          <span className="ml-1">
            (-<Currency amount={preview.discount} />)
          </span>
        )}
      </Button>
    </div>
  );
}
