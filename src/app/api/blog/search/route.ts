import { jsonError } from "@/lib/api-utils";
import { searchBlog } from "@/lib/blog/blog-search-service";
import { jsonOk, searchParamsToObject, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogSearchQuerySchema } from "@/lib/validations/blog";

export async function GET(request: Request) {
  const parsed = blogSearchQuerySchema.safeParse(
    searchParamsToObject(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Parâmetros inválidos", 422);
  }

  try {
    const result = await searchBlog(parsed.data);
    return jsonOk(serializeBlogData(result));
  } catch (e) {
    console.error("[api/blog/search GET]", e);
    return jsonError("Erro na busca", 500);
  }
}
