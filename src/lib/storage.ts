import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const STORAGE_BUCKETS = {
  productImages:
    process.env.SUPABASE_BUCKET_PRODUCT_IMAGES ?? "product-images",
  banners: process.env.SUPABASE_BUCKET_BANNERS ?? "banners",
} as const;

export type StorageKind = "product" | "banner";

export function bucketForKind(kind: StorageKind): string {
  return kind === "product"
    ? STORAGE_BUCKETS.productImages
    : STORAGE_BUCKETS.banners;
}

export function getPublicUrl(bucket: string, path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export async function uploadFile(params: {
  bucket: string;
  path: string;
  body: Buffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.body, {
      contentType: params.contentType,
      upsert: params.upsert ?? true,
    });

  if (error) throw error;
  return getPublicUrl(params.bucket, params.path);
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cleanPath = path.replace(/^\//, "");
  const { error } = await supabase.storage.from(bucket).remove([cleanPath]);
  if (error) throw error;
}

export async function getSignedUploadUrl(params: {
  bucket: string;
  path: string;
  /** Kept for API compatibility; set Content-Type on the client PUT. */
  contentType?: string;
}): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
  bucket: string;
  token: string;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUploadUrl(params.path, { upsert: true });

  if (error || !data) {
    throw error ?? new Error("Failed to create signed upload URL");
  }

  return {
    uploadUrl: data.signedUrl,
    publicUrl: getPublicUrl(params.bucket, params.path),
    key: params.path,
    bucket: params.bucket,
    token: data.token,
  };
}

export function buildProductImageKey(
  productId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `products/${productId}/${Date.now()}-${safe}`;
}

export function buildBannerImageKey(
  bannerId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `banners/${bannerId}/${Date.now()}-${safe}`;
}

/** @deprecated Use uploadFile with bucket + path */
export async function uploadBuffer(params: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  return uploadFile({
    bucket: params.bucket,
    path: params.key,
    body: params.body,
    contentType: params.contentType,
  });
}

/** @deprecated Use deleteFile(bucket, path) */
export async function deleteObject(
  bucket: string,
  path: string,
): Promise<void> {
  return deleteFile(bucket, path);
}

/** @deprecated Use getPublicUrl(bucket, path) */
export function getPublicObjectUrl(bucket: string, path: string): string {
  return getPublicUrl(bucket, path);
}
