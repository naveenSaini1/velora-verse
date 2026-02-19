import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Shipping policies, delivery times, and charges at Velora Verse.",
};

export default function ShippingInfoPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Shipping Information</h1>
      <p className="text-muted-foreground mb-8">Everything you need to know about delivery</p>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Delivery Times</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span>Metro cities (Delhi, Mumbai, Bangalore, etc.)</span>
                <span className="font-medium text-foreground">2-4 business days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span>Tier 2 cities</span>
                <span className="font-medium text-foreground">4-6 business days</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Other locations</span>
                <span className="font-medium text-foreground">5-8 business days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Shipping Charges</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li><strong>Free shipping</strong> on orders above Rs. 999</li>
              <li>Standard delivery: Rs. 49 for orders under Rs. 999</li>
              <li>Express delivery: Rs. 99 (available for metro cities)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Order Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once your order is shipped, you&apos;ll receive a tracking number via email and in your{" "}
              <Link href={ROUTES.ORDERS} className="text-primary hover:underline">order history</Link>.
              You can use this to track your delivery in real time.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Check Delivery Availability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can check if delivery is available to your pincode on any product page using the
              pincode checker. This also shows the estimated delivery date for your location.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Need Help?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For shipping-related queries, contact us at{" "}
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
