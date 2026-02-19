import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Returns & Refund Policy",
  description: "Our returns, exchange, and refund policies at Velora Verse.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Returns & Refund Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Return Window</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We accept returns within <strong>30 days</strong> of delivery. Items must be unused, unworn,
              and in their original packaging with all tags attached.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">How to Request a Return</h2>
            <ol className="text-sm text-muted-foreground leading-relaxed list-decimal list-inside space-y-2">
              <li>Log in to your account and go to <Link href={ROUTES.RETURNS} className="text-primary hover:underline">My Returns</Link></li>
              <li>Click &quot;Request a Return&quot; and select the order</li>
              <li>Choose the items you want to return and the reason</li>
              <li>Submit the request and await approval</li>
              <li>Once approved, ship the items back using the provided instructions</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Eligible Items</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Clothing, footwear, and accessories in original condition</li>
              <li>Items with visible defects or manufacturing faults</li>
              <li>Wrong items received</li>
              <li>Items that don&apos;t match the product description</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Non-Returnable Items</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Gift cards and promotional items</li>
              <li>Items marked as &quot;Final Sale&quot; or &quot;Non-Returnable&quot;</li>
              <li>Items that have been washed, altered, or damaged by the customer</li>
              <li>Intimate wear and swimwear (for hygiene reasons)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Refund Process</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once we receive and inspect your returned items, we&apos;ll process your refund within
              <strong> 5-7 business days</strong>. Refunds are issued to your original payment method.
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li><strong>Online payments:</strong> Refunded to your bank account/card</li>
              <li><strong>Cash on delivery:</strong> Refunded via bank transfer</li>
              <li><strong>Loyalty points:</strong> Points will be restored to your account</li>
              <li><strong>Gift card:</strong> Balance will be restored to your gift card</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Exchanges</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you&apos;d like to exchange an item for a different size or color, please initiate a return
              and place a new order. This ensures the fastest processing time for your exchange.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Need Help?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about our returns policy, please contact us at{" "}
              <a href="mailto:support@veloraverse.com" className="text-primary hover:underline">
                support@veloraverse.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
