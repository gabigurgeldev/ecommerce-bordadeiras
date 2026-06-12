import { jsonError } from "@/lib/api-utils";
import { getCachedPublishedPosts } from "@/lib/blog/blog-post-service";
import { jsonOk, searchParamsToObject, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogListQuerySchema } from "@/lib/validations/blog";

export async function GET(request: Request) {
  const sp = searchParamsToObject(new URL(request.url).searchParams);
  const parsed = blogListQuerySchema.safeParse({
    ...sp,
    includeDeleted: false,
  });

  const page = parsed.success ? parsed.data.page : 1;
  const pageSize = parsed.success ? parsed.data.pageSize : 12;

  try {
    const result = await getCachedPublishedPosts(page, pageSize);
    return jsonOk(serializeBlogData(result));
  } catch (e) {
    console.error("[api/blog/posts GET]", e);
    return jsonError("Erro ao listar posts", 500);
  }
}
