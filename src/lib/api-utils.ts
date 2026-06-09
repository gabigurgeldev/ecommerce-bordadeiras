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

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
