"use client";

import { useState } from "react";
import { CreditCard, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Currency } from "@/components/shared/currency";
import {
  checkGiftCardBalance,
  previewGiftCardRedemption,
} from "@/lib/api/gift-cards";

interface GiftCardInputProps {
  orderTotal: number;
  onApply: (code: string, amount: number) => void;
  onRemove?: () => void;
}

export function GiftCardInput({
  orderTotal,
  onApply,
  onRemove,
}: GiftCardInputProps) {
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceInfo, setBalanceInfo] = useState<{
    balance: number;
    redeemable: number;
    remaining_balance: number;
  } | null>(null);
  const [appliedCard, setAppliedCard] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const handleCheckBalance = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setError(null);
    setIsChecking(true);

    try {
      const balanceResult = await checkGiftCardBalance(trimmed);

      if (!balanceResult.is_valid) {
        setError("Invalid gift card code");
        setBalanceInfo(null);
        return;
      }

      if (balanceResult.current_balance <= 0) {
        setError("This gift card has no remaining balance");
        setBalanceInfo(null);
        return;
      }

      const preview = await previewGiftCardRedemption({
        card_code: trimmed,
        amount: orderTotal,
      });

      setBalanceInfo({
        balance: balanceResult.current_balance,
        redeemable: preview.redeem_amount,
        remaining_balance: preview.remaining_balance,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check gift card"
      );
      setBalanceInfo(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = () => {
    if (!balanceInfo) return;
    const trimmed = code.trim();
    setAppliedCard({ code: trimmed, amount: balanceInfo.redeemable });
    onApply(trimmed, balanceInfo.redeemable);
    setCode("");
    setBalanceInfo(null);
  };

  const handleRemove = () => {
    setAppliedCard(null);
    setBalanceInfo(null);
    setError(null);
    onRemove?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheckBalance();
    }
  };

  // Show applied state
  if (appliedCard) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed border-purple-300 bg-purple-50 px-3 py-2.5 dark:border-purple-700 dark:bg-purple-950">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Gift Card: {appliedCard.code}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500">
              Applied: <Currency amount={appliedCard.amount} />
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          aria-label="Remove gift card"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
              setBalanceInfo(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Gift card code"
            className="pl-9"
            disabled={isChecking}
          />
        </div>
        <Button
          onClick={handleCheckBalance}
          disabled={!code.trim() || isChecking}
          variant="secondary"
        >
          {isChecking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Balance preview */}
      {balanceInfo && (
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Card Balance</span>
            <Currency amount={balanceInfo.balance} className="font-medium" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount to Apply</span>
            <Currency
              amount={balanceInfo.redeemable}
              className="font-semibold text-green-600 dark:text-green-400"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Remaining after use</span>
            <Currency amount={balanceInfo.remaining_balance} />
          </div>
          <Button
            onClick={handleApply}
            size="sm"
            className="w-full mt-1"
          >
            Apply <Currency amount={balanceInfo.redeemable} />
          </Button>
        </div>
      )}
    </div>
  );
}
