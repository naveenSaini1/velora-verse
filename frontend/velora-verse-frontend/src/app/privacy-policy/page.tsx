import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Velora Verse collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Account information (name, email, phone number)</li>
                <li>Shipping and billing addresses</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Order history and product preferences</li>
                <li>Communications with our support team</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Process and fulfill your orders</li>
                <li>Send order updates and shipping notifications</li>
                <li>Provide customer support</li>
                <li>Personalize your shopping experience</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Improve our products and services</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal
              information. Payment processing is handled by Razorpay, a PCI-DSS compliant
              payment gateway. Your card details are never stored on our servers.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Cookies & Analytics</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies to keep your session active and remember your preferences
              (like dark mode and cart contents). Analytics cookies are only loaded with your
              explicit consent and help us understand how visitors interact with our site.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for analytics cookies</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please{" "}
                <Link href={ROUTES.CONTACT} className="text-primary hover:underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use Razorpay for payment processing and may use third-party logistics
              partners for delivery. These partners only receive the information necessary
              to fulfill their services and are contractually obligated to protect your data.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy-related questions or concerns, email us at{" "}
              <a href="mailto:privacy@veloraverse.com" className="text-primary hover:underline">
                privacy@veloraverse.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
