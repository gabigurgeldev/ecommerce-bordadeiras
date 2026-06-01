import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}

/** Customer routes that require authentication (extend as storefront ships). */
const PROTECTED_CUSTOMER_PREFIXES = ["/conta", "/pedidos"] as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCustomerProtected = PROTECTED_CUSTOMER_PREFIXES.some((p) =>
    pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isCustomerProtected) {
    const session = await auth();
    if (!session?.user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = await auth();
  const email = session?.user?.email;
  const role = (session?.user as { role?: Role } | undefined)?.role;

  const allowed = role === Role.ADMIN || isAdminEmail(email);

  if (!allowed) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*", "/pedidos/:path*"],
};
