/** Same cap the server re-encodes to (image-upload-security.ts MAX_WIDTH/MAX_HEIGHT). */
const MAX_UPLOAD_DIMENSION = 1920;

/**
 * Shrinks big photos in the browser before upload. The server resizes to 1920px
 * anyway, so sending a full-size phone photo only burns upload time.
 * Falls back to the original file whenever the browser can't do it.
 */
async function downscaleImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.9),
    );
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "upload"}.webp`, {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

/** Upload de imagem via servidor (Supabase Storage, service role). */
export async function uploadImageViaApi(
  file: File,
  kind: "product" | "banner" | "category",
  entityId: string,
): Promise<string | null> {
  const form = new FormData();
  form.set("kind", kind);
  form.set("entityId", entityId);
  form.set("file", await downscaleImage(file));

  const res = await fetch("/api/uploads/direct", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let errorMsg = "Erro no servidor";
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = (await res.json()) as { publicUrl?: string };
  return data.publicUrl ?? null;
}

/** Upload de foto de avaliação (cliente autenticado). */
export async function uploadReviewImageViaApi(file: File): Promise<string | null> {
  const form = new FormData();
  form.set("file", file);

  const res = await fetch("/api/uploads/review", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let errorMsg = "Erro no servidor";
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = (await res.json()) as { publicUrl?: string };
  return data.publicUrl ?? null;
}
