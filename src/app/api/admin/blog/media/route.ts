import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import { createBlogMedia, uploadBlogImage } from "@/lib/blog/blog-media-service";
import { blogMediaInputSchema } from "@/lib/validations/blog";
import { validateMutationRequest } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  const actor = await requireAdminApi();
  if (!actor) return jsonError("Acesso negado", 403);

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError("Formulário inválido", 400);
    }

    const postId = formData.get("postId");
    const file = formData.get("file");
    if (typeof postId !== "string" || !(file instanceof File)) {
      return jsonError("postId e file são obrigatórios", 400);
    }

    try {
      const result = await uploadBlogImage({ postId, file });
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Erro no upload", 400);
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogMediaInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await createBlogMedia(parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao adicionar mídia", 400);
  }
}
