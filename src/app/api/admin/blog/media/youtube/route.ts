import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { addYouTubeMedia } from "@/lib/blog/blog-media-service";
import { validateYouTubeUrl } from "@/lib/blog/youtube-service";
import { blogYoutubeUrlSchema } from "@/lib/validations/blog";
import { jsonOk } from "@/lib/blog/api-helpers";
import { validateMutationRequest } from "@/lib/csrf";

export const dynamic = "force-dynamic";

/** Validate YouTube URL (GET) or attach to post (POST with postId). */
export async function GET(request: Request) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const url = new URL(request.url).searchParams.get("url");
  const parsed = blogYoutubeUrlSchema.safeParse({ url });
  if (!parsed.success) return jsonError("URL inválida", 422);

  const result = await validateYouTubeUrl(parsed.data.url);
  if (!result.valid) return jsonError(result.error ?? "URL do YouTube inválida", 422);
  return jsonOk({ data: result });
}

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const payload = body as { postId?: string; url?: string };
  if (!payload.postId || !payload.url) {
    return jsonError("postId e url são obrigatórios", 400);
  }

  try {
    const result = await addYouTubeMedia(payload.postId, payload.url);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "URL do YouTube inválida", 400);
  }
}
