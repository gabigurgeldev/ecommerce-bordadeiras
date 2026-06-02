import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  buildBannerImageKey,
  buildProductImageKey,
  uploadBuffer,
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

  if (kind !== "product" && kind !== "banner") {
    return jsonError("kind must be product or banner", 400);
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const key =
    kind === "product"
      ? buildProductImageKey(entityId, file.name)
      : buildBannerImageKey(entityId, file.name);

  try {
    const publicUrl = await uploadBuffer({
      key,
      body: buffer,
      contentType: file.type,
    });
    return NextResponse.json({ publicUrl, key });
  } catch (e) {
    console.error("[uploads/direct]", e);
    return jsonError("Upload failed", 500);
  }
}
