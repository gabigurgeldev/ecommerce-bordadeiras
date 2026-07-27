import { NextResponse } from "next/server";
import { z } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Dados inválidos";
  const path = first.path.length > 0 ? `${String(first.path.join("."))}: ` : "";
  return `${path}${first.message}`;
}

export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: formatZodError(parsed.error),
          details: parsed.error.flatten(),
        },
        { status: 422 }
      ),
    };
  }
  return { success: true, data: parsed.data };
}

/**
 * Rightmost x-forwarded-for hop: that one is appended by our own proxy, while
 * the leftmost entries are attacker-controlled and would let rate limits be
 * sidestepped with a forged header.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const last = hops.at(-1);
    if (last) return last;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
