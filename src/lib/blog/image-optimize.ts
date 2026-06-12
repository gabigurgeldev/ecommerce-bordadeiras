import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 82;

export type OptimizedBlogImage = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
};

/** Resize, compress and convert blog uploads to WebP. GIFs are kept as-is upstream. */
export async function optimizeBlogImage(input: Buffer): Promise<OptimizedBlogImage> {
  const buffer = await sharp(input)
    .rotate()
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { buffer, contentType: "image/webp", extension: "webp" };
}
