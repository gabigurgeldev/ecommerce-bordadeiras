import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

/**
 * Garante JSON válido para o cliente Auth.js — evita "Unexpected token 'I'" quando
 * o handler devolve HTML "Internal Server Error".
 */
async function authSegment(ctx: RouteContext): Promise<string> {
  const { nextauth } = await ctx.params;
  return nextauth?.join("/") ?? "";
}

function jsonFallbackForSegment(segment: string): Response | null {
  if (segment === "session") {
    return Response.json(null);
  }
  if (segment === "csrf") {
    return Response.json({ csrfToken: "" });
  }
  return null;
}

async function withAuthJsonFallback(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<Response>,
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const segment = await authSegment(ctx);

  try {
    const res = await handler(req, ctx);
    const contentType = res.headers.get("content-type") ?? "";

    if (
      !contentType.includes("application/json") &&
      jsonFallbackForSegment(segment)
    ) {
      return jsonFallbackForSegment(segment)!;
    }

    if (!res.ok && jsonFallbackForSegment(segment)) {
      return jsonFallbackForSegment(segment)!;
    }

    return res;
  } catch (error) {
    console.error("[auth]", error);
    const fallback = jsonFallbackForSegment(segment);
    if (fallback) return fallback;

    return Response.json(
      { message: "Erro de autenticação no servidor." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return withAuthJsonFallback(handlers.GET, req, ctx);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return withAuthJsonFallback(handlers.POST, req, ctx);
}
