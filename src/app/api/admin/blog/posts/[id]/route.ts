import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import {
  getBlogPostById,
  updateBlogPost,
  softDeleteBlogPost,
} from "@/lib/blog/blog-post-service";
import { jsonOk, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogPostInputSchema } from "@/lib/validations/blog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    const post = await getBlogPostById(id);
    if (!post) return jsonError("Post não encontrado", 404);
    return jsonOk(serializeBlogData({ data: post }));
  } catch (e) {
    console.error("[admin/blog/posts/[id] GET]", e);
    return jsonError("Erro ao buscar post", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const actor = await requireAdminApi();
  if (!actor) return jsonError("Acesso negado", 403);

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogPostInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await updateBlogPost(id, parsed.data, actor.id);
    return jsonOk({ data: result });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao atualizar post", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    await softDeleteBlogPost(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao excluir post", 400);
  }
}
