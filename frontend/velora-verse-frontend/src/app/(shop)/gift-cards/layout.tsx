import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Send a Velora Verse gift card to someone special. Available in multiple denominations.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
