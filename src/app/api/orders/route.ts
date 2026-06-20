import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";

/** Create order (integration endpoint for checkout flow). */
export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) return jsonError("Unauthorized", 401);

  return jsonError(
    "Endpoint legado desativado. Use o fluxo seguro de checkout.",
    410,
  );
}
