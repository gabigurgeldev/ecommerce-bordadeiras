import { jsonError } from "@/lib/api-utils";
import {
  getCachedPostBySlug,
  incrementBlogPostViews,
} from "@/lib/blog/blog-post-service";
import { buildBlogMetaTags } from "@/lib/blog/blog-seo-service";
import { listApprovedCommentsForPost } from "@/lib/blog/blog-comment-service";
import { jsonOk, serializeBlogData } from "@/lib/blog/api-helpers";
import { rateLimitBlogView } from "@/lib/rate-limit";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const trackView = new URL(request.url).searchParams.get("trackView") === "true";

  try {
    const post = await getCachedPostBySlug(slug);
    if (!post) return jsonError("Post não encontrado", 404);

    if (trackView) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const limited = await rateLimitBlogView(`${ip}:${slug}`);
      if (limited.success) {
        await incrementBlogPostViews(post.id);
      }
    }

    const comments = await listApprovedCommentsForPost(post.id);
    const meta = buildBlogMetaTags(post);

    return jsonOk(
      serializeBlogData({
        data: post,
        meta,
        comments,
      }),
    );
  } catch (e) {
    console.error("[api/blog/posts/[slug] GET]", e);
    return jsonError("Erro ao buscar post", 500);
  }
}
