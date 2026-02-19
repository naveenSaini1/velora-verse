import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order at Velora Verse. Secure payments, fast delivery.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
