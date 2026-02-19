"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ClipboardList, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/utils/constants";

export default function OrderConfirmationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <ClipboardList className="h-9 w-9 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold tracking-tight">
        Couldn&apos;t load order confirmation
      </h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        Something went wrong while loading your order confirmation. Please check your orders page.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={ROUTES.ORDERS}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            My Orders
          </Link>
        </Button>
        <Button onClick={reset} className="rounded-xl">
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Try Again
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && error.message && (
        <details className="mt-6 max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Technical details
          </summary>
          <pre className="mt-2 rounded-2xl bg-muted p-4 text-xs overflow-auto max-h-40">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}
