import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className
      )}
    >
      {icon && (
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/20" />
          <div className="absolute -bottom-1 -left-2 h-2.5 w-2.5 rounded-full bg-primary/15" />
        </div>
      )}
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild className="rounded-2xl px-6">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction} className="rounded-2xl px-6">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
