import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Velora Verse.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms & Conditions</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">1. General</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing and using Velora Verse, you agree to be bound by these Terms
              and Conditions. If you do not agree to these terms, please do not use our
              services. We reserve the right to update these terms at any time, and
              continued use of the site constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">2. Account</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide accurate and complete registration information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not create multiple accounts for the same person</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Orders & Pricing</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                All prices are listed in Indian Rupees (INR) and include applicable taxes
                unless stated otherwise. We reserve the right to modify prices without
                prior notice.
              </p>
              <p>
                An order is confirmed only after successful payment. We reserve the right
                to cancel orders in case of pricing errors, stock unavailability, or
                suspected fraudulent activity.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">4. Returns & Refunds</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Returns are accepted within 7 days of delivery. Items must be unused,
              unwashed, and in original packaging. Refunds are processed within 5-7
              business days of receiving the return. For full details, see our{" "}
              <Link href={ROUTES.RETURNS_POLICY} className="text-primary hover:underline">
                Returns Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content on this site — including text, images, logos, and design — is
              the property of Velora Verse and is protected by copyright law. You may
              not reproduce, distribute, or use any content without our written permission.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">6. User Conduct</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use the site for any unlawful purpose</li>
                <li>Submit false reviews or misleading content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the site</li>
                <li>Use automated tools to scrape or collect data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Velora Verse shall not be liable for any indirect, incidental, or
              consequential damages arising from the use of our services. Our total
              liability for any claim shall not exceed the amount paid by you for the
              relevant order.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these terms, please{" "}
              <Link href={ROUTES.CONTACT} className="text-primary hover:underline">
                contact us
              </Link>{" "}
              or email{" "}
              <a href="mailto:legal@veloraverse.com" className="text-primary hover:underline">
                legal@veloraverse.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
