import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@/lib/types/database";
import { hasAdminAccess } from "@/lib/admin-access";
import { resolveAppRoleForEmail } from "@/lib/middleware-admin-role";
import { updateSession } from "@/lib/supabase/middleware";
import type { User } from "@supabase/supabase-js";

/** Customer routes that require authentication (extend as storefront ships). */
const PROTECTED_CUSTOMER_PREFIXES = ["/conta", "/pedidos", "/checkout"] as const;

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function createContentSecurityPolicy(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
    "https://sdk.mercadopago.com",
    "https://*.mercadopago.com",
    "https://http2.mlstatic.com",
    "https://*.mlstatic.com",
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // TODO(security): replace inline React style attributes and Next/theme style tags
    // with classes/nonces/hashes so production can drop 'unsafe-inline' from style-src.
    "style-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://http2.mlstatic.com https://*.mlstatic.com https://fonts.gstatic.com",
    "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com https://http2.mlstatic.com https://*.mlstatic.com https://www.mercadolibre.com https://*.mercadolibre.com https://events.mercadopago.com https://supabase.bordadeiras.cloud",
    "frame-src 'self' https://youtube.com https://www.youtube.com https://*.youtube.com https://youtube-nocookie.com https://www.youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.google.com https://*.gstatic.com https://*.mercadopago.com https://www.mercadolibre.com https://*.mercadolibre.com https://*.mlstatic.com",
    "child-src 'self' https://youtube.com https://www.youtube.com https://*.youtube.com https://youtube-nocookie.com https://www.youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.google.com https://*.mercadopago.com https://www.mercadolibre.com https://*.mercadolibre.com https://*.mlstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
  ].join("; ");
}

function withCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

type MiddlewareUser = { id: string; email: string; role: Role };

/**
 * Builds the middleware user from the session updateSession already fetched.
 * The DB role lookup only runs for /admin — customer routes just need to know
 * that someone is signed in.
 */
async function resolveMiddlewareUser(
  user: User | null,
  needsRole: boolean,
): Promise<MiddlewareUser | null> {
  if (!user?.email) return null;

  const meta = user.app_metadata as { prisma_id?: string; role?: string } | undefined;
  const jwtRole =
    meta?.role === Role.ADMIN || meta?.role === Role.USER
      ? (meta.role as Role)
      : Role.USER;

  return {
    id: meta?.prisma_id ?? user.id,
    email: user.email,
    role: needsRole ? await resolveAppRoleForEmail(user.email, jwtRole) : jwtRole,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const csp = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { response, user } = await updateSession(request, requestHeaders);

  const isCustomerProtected = PROTECTED_CUSTOMER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isCustomerProtected && !isAdminRoute) {
    return withCsp(response, csp);
  }

  const sessionUser = await resolveMiddlewareUser(user, isAdminRoute);

  if (isCustomerProtected) {
    if (!sessionUser) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return withCsp(NextResponse.redirect(login), csp);
    }
    return withCsp(response, csp);
  }

  if (!hasAdminAccess(sessionUser ?? undefined)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return withCsp(NextResponse.redirect(login), csp);
  }

  response.headers.set("x-pathname", pathname);
  return withCsp(response, csp);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/conta",
    "/conta/:path*",
    "/pedidos",
    "/pedidos/:path*",
    "/checkout",
    "/checkout/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
