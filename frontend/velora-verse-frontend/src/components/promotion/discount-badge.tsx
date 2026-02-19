import { Badge } from "@/components/ui/badge";

interface DiscountBadgeProps {
  discountType: string;
  discountValue: number;
  className?: string;
}

export function DiscountBadge({
  discountType,
  discountValue,
  className,
}: DiscountBadgeProps) {
  const label =
    discountType === "Percentage"
      ? `${discountValue}% OFF`
      : discountType === "Fixed Price"
        ? `Now ₹${discountValue}`
        : `₹${discountValue} OFF`;

  return (
    <Badge variant="destructive" className={className}>
      {label}
    </Badge>
  );
}
