import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import {
  listBlogCategories,
  createBlogCategory,
} from "@/lib/blog/blog-category-service";
import { jsonOk, searchParamsToObject, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogCategoryInputSchema } from "@/lib/validations/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const sp = searchParamsToObject(new URL(request.url).searchParams);
  try {
    const result = await listBlogCategories({
      page: Number(sp.page ?? 1),
      pageSize: Number(sp.pageSize ?? 50),
      search: sp.search,
      sortBy: (sp.sortBy as "name" | "sortOrder" | "postsCount") ?? "sortOrder",
      sortOrder: (sp.sortOrder as "asc" | "desc") ?? "asc",
    });
    return jsonOk(serializeBlogData(result));
  } catch (e) {
    console.error("[admin/blog/categories GET]", e);
    return jsonError("Erro ao listar categorias", 500);
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogCategoryInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await createBlogCategory(parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao criar categoria", 400);
  }
}
