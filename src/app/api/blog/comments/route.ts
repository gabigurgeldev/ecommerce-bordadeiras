import { NextResponse } from "next/server";
import { jsonError, parseBody, getClientIp } from "@/lib/api-utils";
import {
  submitBlogComment,
  listApprovedCommentsForPost,
} from "@/lib/blog/blog-comment-service";
import { blogCommentInputSchema } from "@/lib/validations/blog";
import { jsonOk } from "@/lib/blog/api-helpers";
import { rateLimitBlogComment } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) return jsonError("postId é obrigatório", 400);

  try {
    const comments = await listApprovedCommentsForPost(postId);
    return jsonOk({ items: comments });
  } catch (e) {
    console.error("[api/blog/comments GET]", e);
    return jsonError("Erro ao listar comentários", 500);
  }
}

export async function POST(request: Request) {
  const limited = await rateLimitBlogComment(getClientIp(request));
  if (!limited.success) {
    return jsonError("Muitos comentários enviados. Tente novamente em alguns minutos.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const parsed = parseBody(blogCommentInputSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await submitBlogComment(parsed.data);
    return NextResponse.json(
      {
        data: result,
        message: "Comentário enviado e aguardando moderação.",
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao enviar comentário", 400);
  }
}
