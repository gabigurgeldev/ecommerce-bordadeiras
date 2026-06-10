/** Upload de imagem via servidor (Supabase Storage, service role). */
export async function uploadImageViaApi(
  file: File,
  kind: "product" | "banner" | "category",
  entityId: string,
): Promise<string | null> {
  const form = new FormData();
  form.set("kind", kind);
  form.set("entityId", entityId);
  form.set("file", file);

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
