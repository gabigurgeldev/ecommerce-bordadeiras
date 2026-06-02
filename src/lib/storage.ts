import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const region = process.env.S3_REGION ?? "us-east-1";
const bucket = process.env.S3_BUCKET ?? "bordadeiras";
const accessKey = process.env.S3_ACCESS_KEY ?? "minioadmin";
const secretKey = process.env.S3_SECRET_KEY ?? "minioadmin";
const publicUrl = process.env.S3_PUBLIC_URL ?? endpoint;

export const s3 = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

export function getPublicObjectUrl(key: string): string {
  return `${publicUrl.replace(/\/$/, "")}/${bucket}/${key}`;
}

export async function getSignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: params.expiresIn ?? 300,
  });

  return {
    uploadUrl,
    publicUrl: getPublicObjectUrl(params.key),
    key: params.key,
  };
}

export async function uploadBuffer(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  return getPublicObjectUrl(params.key);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function buildProductImageKey(productId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `products/${productId}/${Date.now()}-${safe}`;
}

export function buildBannerImageKey(bannerId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `banners/${bannerId}/${Date.now()}-${safe}`;
}
