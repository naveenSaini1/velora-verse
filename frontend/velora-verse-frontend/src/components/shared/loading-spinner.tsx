import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-[3px]",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary/20 border-t-primary",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  );
}
