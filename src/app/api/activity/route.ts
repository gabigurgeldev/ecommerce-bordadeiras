import { getSessionUser } from "@/lib/auth/session";
import {
  countRecentActivities,
  recordActivity,
} from "@/lib/data/customer-activity";
import { jsonError } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import {
  canRecordCustomerActivity,
  getUserNotificationPrefs,
  sanitizeActivityPayload,
} from "@/lib/privacy/consent";
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
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }

  const recent = await countRecentActivities(
    sessionUser.id,
    RATE_LIMIT_WINDOW_MS,
  );
  if (recent >= RATE_LIMIT_MAX) {
    return jsonError("Rate limit exceeded", 429);
  }

  const prefs = await getUserNotificationPrefs(sessionUser.id);
  if (!canRecordCustomerActivity(parsed.data.type, prefs)) {
    return NextResponse.json({ ok: false, skipped: "consent_required" });
  }

  const sanitized = sanitizeActivityPayload(parsed.data);

  try {
    await recordActivity({
      userId: sessionUser.id,
      type: parsed.data.type,
      path: sanitized.path,
      productId: sanitized.productId,
      productName: sanitized.productName,
      metadata: sanitized.metadata,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Failed to record", 500);
  }
}
