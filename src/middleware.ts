import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { hasAdminAccess } from "@/lib/admin-access";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

/** Customer routes that require authentication (extend as storefront ships). */
const PROTECTED_CUSTOMER_PREFIXES = ["/conta", "/pedidos"] as const;

async function getMiddlewareSessionUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const meta = user.app_metadata as { prisma_id?: string; role?: string } | undefined;
  const role =
    meta?.role === Role.ADMIN || meta?.role === Role.USER
      ? (meta.role as Role)
      : Role.USER;

  return {
    id: meta?.prisma_id ?? user.id,
    email: user.email,
    role,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = await updateSession(request);

  const isCustomerProtected = PROTECTED_CUSTOMER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isCustomerProtected && !isAdminRoute) {
    return response;
  }

  const sessionUser = await getMiddlewareSessionUser(request);

  if (isCustomerProtected) {
    if (!sessionUser) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return response;
  }

  if (!hasAdminAccess(sessionUser ?? undefined)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/conta",
    "/conta/:path*",
    "/pedidos",
    "/pedidos/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
