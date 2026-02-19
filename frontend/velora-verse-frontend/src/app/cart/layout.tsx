import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your bag and proceed to checkout at Velora Verse.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
