"use client";

import { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getMyGiftCards, purchaseGiftCard } from "@/lib/api/gift-cards";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";

import type { GiftCard, GiftCardStatus } from "@/types/gift-card";

const STATUS_COLORS: Record<GiftCardStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Fully Redeemed": "bg-muted text-muted-foreground",
  Expired: "bg-red-500/10 text-red-600 dark:text-red-400",
  Deactivated: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const STATUS_BAR_COLORS: Record<GiftCardStatus, string> = {
  Active: "bg-emerald-500",
  "Fully Redeemed": "bg-muted-foreground/30",
  Expired: "bg-red-500",
  Deactivated: "bg-amber-500",
};

function maskCardCode(code: string): string {
  if (code.length <= 6) return code;
  return code.slice(0, 3) + "****" + code.slice(-3);
}

export default function GiftCardsPage() {
  const { isLoading: authLoading } = useRequireAuth();

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Purchase form
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchGiftCards();
  }, [authLoading]);

  async function fetchGiftCards() {
    try {
      setLoading(true);
      const data = await getMyGiftCards();
      const all = [...(data.purchased ?? []), ...(data.received ?? [])];
      setGiftCards(all);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load gift cards");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!recipientEmail.trim()) {
      toast.error("Please enter the recipient's email");
      return;
    }

    setIsPurchasing(true);
    try {
      await purchaseGiftCard({
        amount: amountNum,
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || undefined,
        sender_message: message.trim() || undefined,
      });
      toast.success("Gift card purchased successfully!");
      setAmount("");
      setRecipientEmail("");
      setRecipientName("");
      setMessage("");
      fetchGiftCards();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to purchase gift card");
      }
    } finally {
      setIsPurchasing(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gift Cards</h1>
        <p className="text-muted-foreground">
          View your gift cards and purchase new ones
        </p>
      </div>

      {/* My Gift Cards */}
      {giftCards.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-12 w-12" />}
          title="No gift cards"
          description="You don't have any gift cards yet. Purchase one below!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {giftCards.map((card) => (
            <Card
              key={card.name}
              className="overflow-hidden rounded-2xl border-border/60 shadow-sm"
            >
              <div
                className={cn(
                  "h-1.5",
                  STATUS_BAR_COLORS[card.status] ?? "bg-muted"
                )}
              />
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-lg font-semibold tracking-wider">
                      {maskCardCode(card.card_code)}
                    </p>
                    <Badge
                      className={cn(
                        "rounded-full text-xs",
                        STATUS_COLORS[card.status]
                      )}
                      variant="secondary"
                    >
                      {card.status}
                    </Badge>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(card.balance)}
                    </p>
                    {card.balance !== card.initial_amount && (
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(card.initial_amount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {card.recipient_email && (
                    <span>To: {card.recipient_email}</span>
                  )}
                  {card.purchased_on && (
                    <span>Purchased: {formatDate(card.purchased_on)}</span>
                  )}
                  {card.expires_on && (
                    <span>Expires: {formatDate(card.expires_on)}</span>
                  )}
                </div>

                {card.message && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    &ldquo;{card.message}&rdquo;
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Purchase Gift Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Purchase a Gift Card
          </CardTitle>
          <CardDescription>Send a gift card to someone special</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePurchase} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gc_amount">Amount *</Label>
                <Input
                  id="gc_amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  disabled={isPurchasing}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gc_email">Recipient Email *</Label>
                <Input
                  id="gc_email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  disabled={isPurchasing}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gc_name">Recipient Name</Label>
              <Input
                id="gc_name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Their name (optional)"
                disabled={isPurchasing}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gc_message">Personal Message</Label>
              <Textarea
                id="gc_message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message (optional)"
                rows={3}
                disabled={isPurchasing}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="rounded-xl"
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Purchase Gift Card
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
