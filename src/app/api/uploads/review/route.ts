import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-utils";
import {
  STORAGE_BUCKETS,
  buildReviewImageKey,
  uploadFile,
} from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("file is required", 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Unsupported image type", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("File too large (max 8MB)", 400);
  }

  const path = buildReviewImageKey(user.id, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const publicUrl = await uploadFile({
      bucket: STORAGE_BUCKETS.productImages,
      path,
      body: buffer,
      contentType: file.type,
    });
    return NextResponse.json({ publicUrl });
  } catch {
    return jsonError("Upload failed", 500);
  }
}
