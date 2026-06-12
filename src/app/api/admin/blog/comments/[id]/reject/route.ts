import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { rejectBlogComment } from "@/lib/blog/blog-comment-service";
import { jsonOk } from "@/lib/blog/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    const result = await rejectBlogComment(id);
    return jsonOk({ data: result });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao rejeitar comentário", 400);
  }
}
