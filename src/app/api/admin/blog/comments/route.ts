import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { listBlogComments } from "@/lib/blog/blog-comment-service";
import { jsonOk, searchParamsToObject, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogCommentListQuerySchema } from "@/lib/validations/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const parsed = blogCommentListQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams),
  );
  if (!parsed.success) return jsonError("Parâmetros inválidos", 422);

  try {
    const result = await listBlogComments(parsed.data);
    return jsonOk(serializeBlogData(result));
  } catch (e) {
    console.error("[admin/blog/comments GET]", e);
    return jsonError("Erro ao listar comentários", 500);
  }
}
