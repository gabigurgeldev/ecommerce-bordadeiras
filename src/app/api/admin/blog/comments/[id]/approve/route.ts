import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { approveBlogComment } from "@/lib/blog/blog-comment-service";
import { jsonOk } from "@/lib/blog/api-helpers";
import { validateMutationRequest } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    const result = await approveBlogComment(id);
    return jsonOk({ data: result });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao aprovar comentário", 400);
  }
}
