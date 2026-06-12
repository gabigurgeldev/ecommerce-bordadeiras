import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import { reorderBlogCategories } from "@/lib/blog/blog-category-service";
import { jsonOk } from "@/lib/blog/api-helpers";
import { blogCategoryReorderSchema } from "@/lib/validations/blog";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogCategoryReorderSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    await reorderBlogCategories(parsed.data.items);
    return jsonOk({ success: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao reordenar", 400);
  }
}
