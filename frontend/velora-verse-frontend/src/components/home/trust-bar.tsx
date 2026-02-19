import { Truck, RotateCcw, ShieldCheck, Banknote } from "lucide-react";
import { Marquee } from "@/components/animations/marquee";

const TRUST_ITEMS = [
  { icon: Truck, text: "Free Shipping over \u20B91500" },
  { icon: RotateCcw, text: "Hassle-free Returns" },
  { icon: ShieldCheck, text: "Secure Payments" },
  { icon: Banknote, text: "COD Available" },
  { icon: Truck, text: "Free Shipping over \u20B91500" },
  { icon: RotateCcw, text: "Hassle-free Returns" },
  { icon: ShieldCheck, text: "Secure Payments" },
  { icon: Banknote, text: "COD Available" },
];

export function TrustBar() {
  return (
    <div className="border-y border-border/50 bg-secondary/30 py-4">
      <Marquee speed={40} pauseOnHover>
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-6 text-sm text-muted-foreground"
          >
            <item.icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="whitespace-nowrap font-medium">{item.text}</span>
            <span className="ml-6 text-border">&middot;</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
