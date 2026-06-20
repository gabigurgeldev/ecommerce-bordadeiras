import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  return jsonError(
    "Signed uploads are disabled; use /api/uploads/direct so the server can validate and reprocess the image.",
    410,
  );
}
