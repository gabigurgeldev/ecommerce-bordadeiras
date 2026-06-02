import { onOrderCancelled } from "@/lib/hooks/order-notifications";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  const { id } = await params;
  await onOrderCancelled(id);
  return NextResponse.json({ ok: true });
}
