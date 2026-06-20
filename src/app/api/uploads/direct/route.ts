import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  buildBannerImageKey,
  buildCategoryImageKey,
  buildProductImageKey,
  bucketForKind,
  uploadFile,
} from "@/lib/storage";
import { jsonError } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import {
  prepareImageUpload,
  type PreparedImageUpload,
} from "@/lib/image-upload-security";

const MAX_BYTES = 8 * 1024 * 1024;
export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data", 400);
  }

  const kind = formData.get("kind");
  const entityId = formData.get("entityId");
  const file = formData.get("file");

  if (kind !== "product" && kind !== "banner" && kind !== "category") {
    return jsonError("kind must be product, banner, or category", 400);
  }
  if (typeof entityId !== "string" || entityId.length < 1 || entityId.length > 64) {
    return jsonError("Invalid entityId", 400);
  }
  if (!(file instanceof File)) {
    return jsonError("file is required", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("File too large (max 8MB)", 400);
  }

  const bucket = bucketForKind(kind);
  const buffer = Buffer.from(await file.arrayBuffer());
  let prepared: PreparedImageUpload;
  try {
    prepared = await prepareImageUpload({
      buffer,
      declaredType: file.type,
      filename: file.name,
      reencode: true,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unsupported image type", 400);
  }

  const path =
    kind === "product"
      ? buildProductImageKey(entityId, prepared.filename)
      : kind === "banner"
        ? buildBannerImageKey(entityId, prepared.filename)
        : buildCategoryImageKey(entityId, prepared.filename);

  console.log(`[uploads/direct] Starting upload to bucket: ${bucket}, path: ${path}, size: ${prepared.buffer.length} bytes`);

  try {
    const publicUrl = await uploadFile({
      bucket,
      path,
      body: prepared.buffer,
      contentType: prepared.contentType,
    });
    console.log(`[uploads/direct] Upload successful: ${publicUrl}`);
    return NextResponse.json({ publicUrl, key: path, bucket });
  } catch (e) {
    console.error("[uploads/direct] Storage upload failed:", e);
    return jsonError("Upload failed", 500);
  }
}
