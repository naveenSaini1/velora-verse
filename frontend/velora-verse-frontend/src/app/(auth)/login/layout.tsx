import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Velora Verse account to track orders, manage your wishlist and more.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
