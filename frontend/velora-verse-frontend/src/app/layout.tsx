import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

const SearchDialog = dynamic(
  () => import("@/components/search/search-dialog").then((m) => m.SearchDialog)
);
const QuickViewModal = dynamic(
  () => import("@/components/product/quick-view-modal").then((m) => m.QuickViewModal)
);
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans-theme",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Velora Verse",
    template: "%s | Velora Verse",
  },
  description:
    "Discover beautifully curated products at Velora Verse — your friendly neighborhood store.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "theme-color": "#171717",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1 pt-16 pb-16 md:pb-0">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
          <SearchDialog />
          <QuickViewModal />
          <MobileNav />
          <BottomNav />
          <CookieConsent />
          <ScrollToTop />
        </Providers>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
