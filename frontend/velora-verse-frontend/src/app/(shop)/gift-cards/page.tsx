"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/utils/constants";
import { formatCurrency } from "@/lib/utils/format-currency";
import { purchaseGiftCard } from "@/lib/api/gift-cards";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  Gift,
  Mail,
  CreditCard,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ScrollReveal } from "@/components/animations";

const DENOMINATIONS = [500, 1000, 2000, 3000, 5000, 10000];

export default function GiftCardsPage() {
  const { isLoggedIn } = useAuthStore();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const amount =
    selectedAmount || (customAmount ? Number(customAmount) : 0);
  const isValidAmount = amount >= 100 && amount <= 50000;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
  const canSubmit = isValidAmount && isValidEmail && !submitting;

  const handleDenominationClick = (denom: number) => {
    setSelectedAmount(denom);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    setCustomAmount(numeric);
    setSelectedAmount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await purchaseGiftCard({
        amount,
        recipient_email: recipientEmail,
        recipient_name: recipientName || undefined,
        sender_message: message || undefined,
      });
      setPurchased(true);
      toast.success("Gift card purchased successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to purchase gift card"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount("");
    setRecipientEmail("");
    setRecipientName("");
    setMessage("");
    setPurchased(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Gift Cards" },
        ]}
        className="mb-4"
      />

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <ScrollReveal direction="up" duration={0.5}>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Gift Cards
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            The perfect gift for any occasion. Send a Velora Verse gift card to
            someone special and let them choose what they love.
          </p>
        </div>
        </ScrollReveal>

        {purchased ? (
          /* Success state */
          <Card className="text-center py-12 rounded-2xl">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold">Gift Card Sent!</h2>
              <p className="text-muted-foreground max-w-sm">
                A gift card for {formatCurrency(amount)} has been sent to{" "}
                <span className="font-medium text-foreground">
                  {recipientEmail}
                </span>
                .
              </p>
              <div className="flex gap-3 mt-4">
                <Button onClick={resetForm} variant="outline">
                  Send Another
                </Button>
                <Button asChild>
                  <Link href={ROUTES.PRODUCTS}>Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-5">
              {/* Left: Amount selection + form */}
              <div className="md:col-span-3 flex flex-col gap-6">
                {/* Denomination selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Select Amount
                    </h2>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2">
                      {DENOMINATIONS.map((denom) => (
                        <Button
                          key={denom}
                          type="button"
                          variant={
                            selectedAmount === denom ? "default" : "outline"
                          }
                          className="h-12"
                          onClick={() => handleDenominationClick(denom)}
                        >
                          {formatCurrency(denom)}
                        </Button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="custom-amount" className="text-sm">
                        Or enter a custom amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ₹
                        </span>
                        <Input
                          id="custom-amount"
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter amount (₹100 - ₹50,000)"
                          value={customAmount}
                          onChange={(e) =>
                            handleCustomAmountChange(e.target.value)
                          }
                          className="pl-7"
                        />
                      </div>
                      {customAmount && !isValidAmount && (
                        <p className="text-xs text-destructive">
                          Amount must be between ₹100 and ₹50,000
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recipient details */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Recipient Details
                    </h2>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="recipient-email" className="text-sm">
                        Recipient Email *
                      </Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="recipient-name" className="text-sm">
                        Recipient Name (optional)
                      </Label>
                      <Input
                        id="recipient-name"
                        type="text"
                        placeholder="Enter recipient's name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="message" className="text-sm">
                        Personal Message (optional)
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Write a personal message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {message.length}/500
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Summary + Info */}
              <div className="md:col-span-2 flex flex-col gap-6">
                {/* Order summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold">Order Summary</h2>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gift Card</span>
                      <span className="font-semibold">
                        {isValidAmount ? formatCurrency(amount) : "--"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {isValidAmount ? formatCurrency(amount) : "--"}
                      </span>
                    </div>

                    {!isLoggedIn ? (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          Please log in to purchase a gift card.
                        </p>
                        <Button asChild className="w-full">
                          <Link href={ROUTES.LOGIN}>Log In</Link>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full mt-2"
                        size="lg"
                        disabled={!canSubmit}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Gift className="mr-2 h-4 w-4" />
                            Purchase Gift Card
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How It Works
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <Badge
                          variant="outline"
                          className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs"
                        >
                          1
                        </Badge>
                        <span>
                          Choose an amount and enter the recipient&apos;s email
                          address.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Badge
                          variant="outline"
                          className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs"
                        >
                          2
                        </Badge>
                        <span>
                          We&apos;ll send the gift card code directly to them
                          via email.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Badge
                          variant="outline"
                          className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs"
                        >
                          3
                        </Badge>
                        <span>
                          They can apply the code at checkout to redeem their
                          balance.
                        </span>
                      </li>
                    </ol>

                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                      <p>
                        Gift cards are valid for 12 months from the date of
                        purchase.
                      </p>
                      <p>
                        Gift cards can be used across multiple orders until the
                        balance is exhausted.
                      </p>
                      <p>Gift cards are non-refundable and non-transferable.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
