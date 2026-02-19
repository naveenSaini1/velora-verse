import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const halfFilled = !filled && i < rating;

        return (
          <Star
            key={i}
            size={size}
            className={cn(
              filled
                ? "fill-yellow-400 text-yellow-400"
                : halfFilled
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-muted-foreground/30"
            )}
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
