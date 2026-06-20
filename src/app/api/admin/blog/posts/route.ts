import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import { listBlogPosts, createBlogPost } from "@/lib/blog/blog-post-service";
import { jsonOk, searchParamsToObject, serializeBlogData } from "@/lib/blog/api-helpers";
import { blogListQuerySchema, blogPostInputSchema } from "@/lib/validations/blog";
import { validateMutationRequest } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const parsed = blogListQuerySchema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!parsed.success) return jsonError("Parâmetros inválidos", 422);

  try {
    const result = await listBlogPosts(parsed.data);
    return jsonOk(serializeBlogData(result));
  } catch (e) {
    console.error("[admin/blog/posts GET]", e);
    return jsonError("Erro ao listar posts", 500);
  }
}

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  const actor = await requireAdminApi();
  if (!actor) return jsonError("Acesso negado", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogPostInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await createBlogPost(parsed.data, actor.id);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao criar post", 400);
  }
}
