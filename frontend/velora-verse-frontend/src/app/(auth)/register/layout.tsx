import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Velora Verse for exclusive deals, order tracking and a personalised shopping experience.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
