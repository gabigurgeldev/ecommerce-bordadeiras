import sharp from "sharp";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 82;

const IMAGE_EXTENSIONS: Record<SupportedImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type PreparedImageUpload = {
  buffer: Buffer;
  contentType: SupportedImageMime;
  detectedType: SupportedImageMime;
  filename: string;
};

export function detectImageMime(buffer: Buffer): SupportedImageMime | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  const header = buffer.subarray(0, 6).toString("ascii");
  if (header === "GIF87a" || header === "GIF89a") {
    return "image/gif";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function prepareImageUpload(params: {
  buffer: Buffer;
  declaredType?: string;
  filename: string;
  reencode?: boolean;
}): Promise<PreparedImageUpload> {
  const detectedType = detectImageMime(params.buffer);
  if (!detectedType) {
    throw new Error("Tipo de imagem não suportado");
  }

  if (params.declaredType && params.declaredType !== detectedType) {
    throw new Error("Tipo de imagem não corresponde ao conteúdo");
  }

  if (!params.reencode || detectedType === "image/gif") {
    return {
      buffer: params.buffer,
      contentType: detectedType,
      detectedType,
      filename: withExtension(params.filename, IMAGE_EXTENSIONS[detectedType]),
    };
  }

  const buffer = await sharp(params.buffer)
    .rotate()
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    detectedType,
    filename: withExtension(params.filename, "webp"),
  };
}

function withExtension(filename: string, extension: string): string {
  const base = filename.replace(/\.[^.]+$/i, "") || "upload";
  return `${base}.${extension}`;
}
