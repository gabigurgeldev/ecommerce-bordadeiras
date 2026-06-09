import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  STORAGE_BUCKETS,
  buildProductImageKey,
  getSignedUploadUrl,
} from "@/lib/storage";
import { jsonError, parseBody } from "@/lib/api-utils";

const schema = z.object({
  productId: z.string().cuid(),
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

  const path = buildProductImageKey(
    parsed.data.productId,
    parsed.data.filename,
  );

  console.log(`[uploads/signed] Generating signed URL for bucket: ${STORAGE_BUCKETS.productImages}, path: ${path}`);

  try {
    const signed = await getSignedUploadUrl({
      bucket: STORAGE_BUCKETS.productImages,
      path,
      contentType: parsed.data.contentType,
    });
    console.log(`[uploads/signed] Signed URL generated successfully`);
    return NextResponse.json(signed);
  } catch (e: any) {
    console.error("[uploads/signed] Failed to create signed upload URL:", e);
    const errorMessage = e?.message || "Failed to create signed upload URL";
    return jsonError(errorMessage, 500);
  }
}
