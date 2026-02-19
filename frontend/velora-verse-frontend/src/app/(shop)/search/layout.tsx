import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search our catalogue of fashion, footwear, accessories and more at Velora Verse.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
