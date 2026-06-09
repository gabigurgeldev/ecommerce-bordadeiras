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

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Unsupported image type", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("File too large (max 8MB)", 400);
  }

  const bucket = bucketForKind(kind);
  const path =
    kind === "product"
      ? buildProductImageKey(entityId, file.name)
      : kind === "banner"
        ? buildBannerImageKey(entityId, file.name)
        : buildCategoryImageKey(entityId, file.name);

  console.log(`[uploads/direct] Starting upload to bucket: ${bucket}, path: ${path}, size: ${file.size} bytes`);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const publicUrl = await uploadFile({
      bucket,
      path,
      body: buffer,
      contentType: file.type,
    });
    console.log(`[uploads/direct] Upload successful: ${publicUrl}`);
    return NextResponse.json({ publicUrl, key: path, bucket });
  } catch (e: any) {
    console.error("[uploads/direct] Storage upload failed:", e);
    const errorMessage = e?.message || "Upload failed due to unknown storage error";
    return jsonError(errorMessage, 500);
  }
}
