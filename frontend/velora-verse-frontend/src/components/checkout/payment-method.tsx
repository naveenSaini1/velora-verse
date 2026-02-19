"use client";

import { CreditCard, Banknote, Shield } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PaymentMethodProps {
  codEnabled: boolean;
  razorpayEnabled: boolean;
  selected: string | null;
  onSelect: (method: string) => void;
}

const PAYMENT_OPTIONS = [
  {
    id: "Razorpay",
    label: "Razorpay",
    description: "Cards, UPI, Netbanking, Wallets",
    icon: CreditCard,
    enabledKey: "razorpayEnabled" as const,
  },
  {
    id: "COD",
    label: "Cash on Delivery",
    description: "Pay when your order is delivered",
    icon: Banknote,
    enabledKey: "codEnabled" as const,
  },
];

export function PaymentMethod({
  codEnabled,
  razorpayEnabled,
  selected,
  onSelect,
}: PaymentMethodProps) {
  const enabledMap = { codEnabled, razorpayEnabled };
  const availableOptions = PAYMENT_OPTIONS.filter(
    (option) => enabledMap[option.enabledKey]
  );

  if (availableOptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <CreditCard className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No payment methods are currently available. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RadioGroup value={selected ?? undefined} onValueChange={onSelect}>
        <div className="grid gap-3">
          {availableOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <Label
                key={option.id}
                htmlFor={`payment-${option.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem
                  id={`payment-${option.id}`}
                  value={option.id}
                />

                <div className="text-muted-foreground">
                  <Icon className="size-5" />
                </div>

                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </Label>
            );
          })}
        </div>
      </RadioGroup>

      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Shield className="size-3.5 shrink-0" />
        <span>Your payment information is encrypted and secure.</span>
      </div>
    </div>
  );
}
