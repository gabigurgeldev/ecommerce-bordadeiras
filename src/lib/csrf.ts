import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getAppOrigin } from "@/lib/app-url";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return token;
}

export async function validateCsrfToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;

  try {
    const a = Buffer.from(cookieToken);
    const b = Buffer.from(headerToken);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function originFromUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getForwardedOrigin(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return originFromUrl(`${proto}://${host}`);
}

function getAllowedOrigins(request: Request): Set<string> {
  return new Set(
    [getAppOrigin(), originFromUrl(request.url), getForwardedOrigin(request)]
      .filter((origin): origin is string => Boolean(origin)),
  );
}

function isTrustedOrigin(request: Request, value: string | null): boolean {
  const origin = originFromUrl(value);
  return origin != null && getAllowedOrigins(request).has(origin);
}

/**
 * Guard for authenticated mutation endpoints.
 * Browser requests must come from this app's origin; non-browser clients must
 * provide the double-submit CSRF token used by auth forms.
 */
export async function validateMutationRequest(request: Request): Promise<boolean> {
  const origin = request.headers.get("origin");
  if (origin) return isTrustedOrigin(request, origin);

  const referer = request.headers.get("referer");
  if (referer) return isTrustedOrigin(request, referer);

  return validateCsrfToken(request.headers.get(CSRF_HEADER));
}

export { CSRF_HEADER };

/** Hash for double-submit pattern in forms without cookie access. */
export function hashCsrf(secret: string, token: string): string {
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}
