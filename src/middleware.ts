import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}

function isAdminSession(user: { email?: string | null; role?: Role | string } | undefined) {
  if (!user?.email) return false;
  const role = user.role as Role | undefined;
  return role === Role.ADMIN || isAdminEmail(user.email);
}

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

  if (!isAdminSession(session?.user)) {
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
