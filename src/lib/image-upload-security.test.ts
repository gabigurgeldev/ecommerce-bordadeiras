import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { detectImageMime, prepareImageUpload } from "./image-upload-security";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8z8AARQAByQH9T63xZQAAAABJRU5ErkJggg==",
  "base64",
);

describe("image-upload-security", () => {
  it("detects supported image types from magic bytes", () => {
    expect(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      "image/jpeg",
    );
    expect(detectImageMime(ONE_PIXEL_PNG)).toBe("image/png");
    expect(detectImageMime(Buffer.from("GIF89a000000", "ascii"))).toBe("image/gif");
    expect(detectImageMime(Buffer.from("RIFF0000WEBP", "ascii"))).toBe("image/webp");
  });

  it("rejects declared content types that do not match the file signature", async () => {
    await expect(
      prepareImageUpload({
        buffer: ONE_PIXEL_PNG,
        declaredType: "image/jpeg",
        filename: "photo.jpg",
      }),
    ).rejects.toThrow("Tipo de imagem não corresponde ao conteúdo");
  });

  it("reprocesses non-GIF uploads to WebP", async () => {
    const png = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const prepared = await prepareImageUpload({
      buffer: png,
      declaredType: "image/png",
      filename: "photo.png",
      reencode: true,
    });

    expect(prepared.contentType).toBe("image/webp");
    expect(prepared.filename).toBe("photo.webp");
    expect(detectImageMime(prepared.buffer)).toBe("image/webp");
  });
});
