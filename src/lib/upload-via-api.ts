/** Upload de imagem via servidor (MinIO interno) — funciona em produção/EasyPanel. */
export async function uploadImageViaApi(
  file: File,
  kind: "product" | "banner",
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

  if (!res.ok) return null;

  const data = (await res.json()) as { publicUrl?: string };
  return data.publicUrl ?? null;
}
