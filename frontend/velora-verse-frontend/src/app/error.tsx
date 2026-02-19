"use client";

import { useEffect } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to a reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Warm icon */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary/20" />
        <div className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-primary/15" />
      </div>

      {/* Friendly heading */}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Something went a little sideways
      </h1>
      <p className="mt-3 text-muted-foreground max-w-md text-base leading-relaxed">
        We hit an unexpected bump, but it&apos;s nothing we can&apos;t handle.
        Give it another try and things should be back to normal.
      </p>

      {/* Reset button */}
      <div className="mt-8">
        <Button
          onClick={reset}
          size="lg"
          className="rounded-2xl px-8"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>

      {/* Subtle error info for debugging (only in development) */}
      {process.env.NODE_ENV === "development" && error.message && (
        <details className="mt-8 max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            Technical details
          </summary>
          <pre className="mt-2 rounded-2xl bg-muted p-4 text-xs text-muted-foreground overflow-auto max-h-40">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        </details>
      )}
    </div>
  );
}
