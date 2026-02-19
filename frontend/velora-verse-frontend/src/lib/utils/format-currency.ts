export function formatCurrency(
  amount: number,
  currencySymbol: string = "₹"
): string {
  const safeAmount = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
  return `${currencySymbol}${formatted}`;
}

export function formatDiscount(
  discountType: string,
  discountValue: number,
  currencySymbol: string = "₹"
): string {
  if (discountType === "Percentage") {
    return `${discountValue}% off`;
  }
  return `${currencySymbol}${discountValue} off`;
}
