import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { duplicateBlogPost } from "@/lib/blog/blog-post-service";
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

  const actor = await requireAdminApi();
  if (!actor) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    const result = await duplicateBlogPost(id, actor.id);
    return jsonOk({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao duplicar post", 400);
  }
}
