import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError, parseBody } from "@/lib/api-utils";
import { enhanceBlogText } from "@/lib/blog/ai-text-enhancer-service";
import { OpenRouterError } from "@/lib/openrouter/client";
import { blogAiEnhanceSchema } from "@/lib/validations/blog";
import { jsonOk } from "@/lib/blog/api-helpers";
import { validateMutationRequest } from "@/lib/csrf";

export const dynamic = "force-dynamic";

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

  const parsed = parseBody(blogAiEnhanceSchema, body);
  if (!parsed.success) return parsed.response;

  try {
    const data = await enhanceBlogText(parsed.data);
    return jsonOk({ data });
  } catch (e) {
    if (e instanceof OpenRouterError) return jsonError(e.message, 503);
    return jsonError("Falha ao comunicar com a IA", 500);
  }
}
