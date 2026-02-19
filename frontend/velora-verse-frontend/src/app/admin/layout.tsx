import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Store admin dashboard with sales, orders, and analytics.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
