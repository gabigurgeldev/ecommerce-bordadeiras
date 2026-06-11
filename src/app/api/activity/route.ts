import { getSessionUser } from "@/lib/auth/session";
import {
  countRecentActivities,
  recordActivity,
} from "@/lib/data/customer-activity";
import { CustomerActivityType } from "@/lib/types/database";
import { NextResponse } from "next/server";
import { z } from "zod";

const activitySchema = z.object({
  type: z.nativeEnum(CustomerActivityType),
  path: z.string().max(500).optional().nullable(),
  productId: z.string().max(100).optional().nullable(),
  productName: z.string().max(300).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const recent = await countRecentActivities(
    sessionUser.id,
    RATE_LIMIT_WINDOW_MS,
  );
  if (recent >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    await recordActivity({
      userId: sessionUser.id,
      type: parsed.data.type,
      path: parsed.data.path,
      productId: parsed.data.productId,
      productName: parsed.data.productName,
      metadata: parsed.data.metadata,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
