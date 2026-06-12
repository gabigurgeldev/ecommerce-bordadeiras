import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import {
  getBlogCategoryById,
  updateBlogCategory,
  deleteBlogCategory,
} from "@/lib/blog/blog-category-service";
import { jsonOk, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogCategoryInputSchema } from "@/lib/validations/blog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  const category = await getBlogCategoryById(id);
  if (!category) return jsonError("Categoria não encontrada", 404);
  return jsonOk(serializeBlogData({ data: category }));
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogCategoryInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await updateBlogCategory(id, parsed.data);
    return jsonOk({ data: result });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao atualizar categoria", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    await deleteBlogCategory(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao excluir categoria", 400);
  }
}
