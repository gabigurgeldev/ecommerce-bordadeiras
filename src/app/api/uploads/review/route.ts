import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import {
  STORAGE_BUCKETS,
  buildReviewImageKey,
  uploadFile,
} from "@/lib/storage";
import {
  prepareImageUpload,
  type PreparedImageUpload,
} from "@/lib/image-upload-security";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

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
  if (file.size > MAX_BYTES) {
    return jsonError("File too large (max 8MB)", 400);
  }

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

  const path = buildReviewImageKey(user.id, prepared.filename);

  try {
    const publicUrl = await uploadFile({
      bucket: STORAGE_BUCKETS.productImages,
      path,
      body: prepared.buffer,
      contentType: prepared.contentType,
    });
    return NextResponse.json({ publicUrl });
  } catch {
    return jsonError("Upload failed", 500);
  }
}
