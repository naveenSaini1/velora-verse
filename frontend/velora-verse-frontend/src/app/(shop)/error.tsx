"use client";

import { useEffect } from "react";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopError({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
        <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        Oops, something went wrong
      </h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        We couldn&apos;t load the page you were looking for. Please try again.
      </p>
      <Button onClick={reset} size="lg" className="mt-6 rounded-2xl px-8">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
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
