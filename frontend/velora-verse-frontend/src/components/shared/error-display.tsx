"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  className?: string;
}

export function ErrorDisplay({
  title = "Oops, something went wrong",
  message = "We ran into an unexpected issue. Please try again and it should clear right up.",
  onRetry,
  showHomeLink = false,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <AlertCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/20" />
        <div className="absolute -bottom-1 -left-2 h-2.5 w-2.5 rounded-full bg-primary/15" />
      </div>

      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {message}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="rounded-2xl px-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {showHomeLink && (
          <Button asChild variant="outline" className="rounded-2xl px-6">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
