"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

const COOKIE_CONSENT_KEY = "vv-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on initial render
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="container mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use cookies to enhance your experience. Essential cookies keep the site
            working. Analytics cookies help us improve — but only with your consent.{" "}
            <Link
              href={ROUTES.PRIVACY_POLICY}
              className="text-primary hover:underline"
            >
              Learn more
            </Link>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={accept} size="sm" className="rounded-xl">
              Accept All
            </Button>
            <Button
              onClick={decline}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              Essential Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
