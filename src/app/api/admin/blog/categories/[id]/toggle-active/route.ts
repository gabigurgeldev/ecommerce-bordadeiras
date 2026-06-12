import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { toggleBlogCategoryActive } from "@/lib/blog/blog-category-service";
import { jsonOk } from "@/lib/blog/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    const result = await toggleBlogCategoryActive(id);
    return jsonOk({ data: result });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao alterar status", 400);
  }
}
