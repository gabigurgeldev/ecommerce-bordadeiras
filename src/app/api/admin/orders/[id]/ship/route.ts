import { onOrderShipped } from "@/lib/hooks/order-notifications";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await onOrderShipped(id);
  return NextResponse.json({ ok: true });
}
