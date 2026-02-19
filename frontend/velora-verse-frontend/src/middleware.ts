import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = [
  "/profile",
  "/addresses",
  "/orders",
  "/wishlist",
  "/returns",
  "/loyalty",
  "/notifications",
  "/checkout",
  "/my-gift-cards",
  "/admin",
];

const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sid = request.cookies.get("sid")?.value;
  const isLoggedIn = sid && sid !== "Guest";

  // Protect authenticated routes
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from guest-only routes
  if (GUEST_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/addresses/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/returns/:path*",
    "/loyalty/:path*",
    "/notifications/:path*",
    "/checkout/:path*",
    "/my-gift-cards/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
