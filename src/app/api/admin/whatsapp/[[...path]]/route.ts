import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin-auth";
import {
  getWhatsappQr,
  logoutWhatsapp,
  reconnectWhatsapp,
} from "@/lib/whatsapp-client";
import { jsonError } from "@/lib/api-utils";
import { getWhatsappServiceBaseUrl } from "@/lib/whatsapp-service-url";

const secret = process.env.WHATSAPP_SERVICE_SECRET ?? "";
const baseUrl = getWhatsappServiceBaseUrl();

async function requireAdminApi() {
  const actor = await getAdminActor();
  if (!actor) return null;
  return actor;
}

async function proxy(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  const { path = [] } = await params;
  const segment = path.join("/");

  if (segment === "qr") {
    try {
      const data = await getWhatsappQr();
      return NextResponse.json(data);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "WhatsApp error", 502);
    }
  }

  if (segment === "status") {
    return proxy("GET", "/session/status");
  }

  return jsonError("Not found", 404);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  const { path = [] } = await params;
  const segment = path.join("/");

  if (segment === "reconnect") {
    try {
      const data = await reconnectWhatsapp();
      return NextResponse.json(data);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "WhatsApp error", 502);
    }
  }

  if (segment === "logout") {
    try {
      const data = await logoutWhatsapp();
      return NextResponse.json(data);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "WhatsApp error", 502);
    }
  }

  if (segment === "send") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON");
    }
    return proxy("POST", "/messages/send", body);
  }

  return jsonError("Not found", 404);
}
