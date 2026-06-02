import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminAccess } from "@/lib/admin-access";

/** Customer routes that require authentication (extend as storefront ships). */
const PROTECTED_CUSTOMER_PREFIXES = ["/conta", "/pedidos"] as const;

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  const isCustomerProtected = PROTECTED_CUSTOMER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isCustomerProtected) {
    if (!session?.user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  if (!hasAdminAccess(session?.user)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/conta",
    "/conta/:path*",
    "/pedidos",
    "/pedidos/:path*",
  ],
};
