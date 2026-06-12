import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { deleteBlogComment } from "@/lib/blog/blog-comment-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) return jsonError("Acesso negado", 403);

  const { id } = await params;
  try {
    await deleteBlogComment(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao excluir comentário", 400);
  }
}
