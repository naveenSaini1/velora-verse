import { formatCurrency } from "@/lib/utils/format-currency";

interface CurrencyProps {
  amount: number;
  symbol?: string;
  className?: string;
}

export function Currency({ amount, symbol = "₹", className }: CurrencyProps) {
  return <span className={className}>{formatCurrency(amount, symbol)}</span>;
}
