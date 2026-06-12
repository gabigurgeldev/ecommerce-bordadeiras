import { jsonError } from "@/lib/api-utils";
import { listBlogCategories } from "@/lib/blog/blog-category-service";
import { jsonOk, serializeBlogData } from "@/lib/blog/api-helpers";

export async function GET() {
  try {
    const result = await listBlogCategories({
      page: 1,
      pageSize: 100,
      activeOnly: true,
      sortBy: "sortOrder",
      sortOrder: "asc",
    });
    return jsonOk(serializeBlogData({ items: result.items }));
  } catch (e) {
    console.error("[api/blog/categories GET]", e);
    return jsonError("Erro ao listar categorias", 500);
  }
}
