import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { buildBannerImageKey, getSignedUploadUrl } from "@/lib/storage";
import { jsonError, parseBody } from "@/lib/api-utils";

const schema = z.object({
  bannerId: z.string().min(1).max(64),
  filename: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
});

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const key = buildBannerImageKey(parsed.data.bannerId, parsed.data.filename);
  const signed = await getSignedUploadUrl({
    key,
    contentType: parsed.data.contentType,
  });

  return NextResponse.json(signed);
}
