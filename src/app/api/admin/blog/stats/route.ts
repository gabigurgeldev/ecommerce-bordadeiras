import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { getBlogStats } from "@/lib/blog/blog-stats-service";
import { jsonOk, serializeBlogData } from "@/lib/blog/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  try {
    const stats = await getBlogStats();
    return jsonOk(serializeBlogData({ data: stats }));
  } catch (e) {
    console.error("[admin/blog/stats GET]", e);
    return jsonError("Erro ao carregar estatísticas", 500);
  }
}
