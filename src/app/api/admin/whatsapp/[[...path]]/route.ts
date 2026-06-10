import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin-auth";
import {
  getWhatsappQr,
  logoutWhatsapp,
  reconnectWhatsapp,
  checkWhatsappServiceHealth,
} from "@/lib/whatsapp-client";
import { jsonError } from "@/lib/api-utils";
import { WhatsappServiceError } from "@/lib/whatsapp-fetch";
import { getWhatsappServiceBaseUrl } from "@/lib/whatsapp-service-url";
import { getDb, TABLES } from "@/lib/supabase/db";

async function requireAdminApi() {
  const actor = await getAdminActor();
  if (!actor) return null;
  return actor;
}

async function getFallbackSessionFromDb() {
  const { data } = await getDb()
    .from(TABLES.WhatsappSession)
    .select("status, qrCode")
    .eq("sessionId", "default")
    .maybeSingle();

  return {
    status: data?.status != null ? String(data.status) : "disconnected",
    qr: data?.qrCode != null ? String(data.qrCode) : undefined,
  };
}

function whatsappServiceErrorResponse(err: unknown) {
  const message =
    err instanceof WhatsappServiceError
      ? err.message
      : err instanceof Error
        ? err.message
        : "WhatsApp error";

  return NextResponse.json(
    {
      error: message,
      serviceUrl: getWhatsappServiceBaseUrl(),
      serviceReachable: false,
    },
    { status: 503 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  const { path = [] } = await params;
  const segment = path.join("/");

  if (segment === "health") {
    try {
      const data = await checkWhatsappServiceHealth();
      return NextResponse.json({
        ...data,
        serviceUrl: getWhatsappServiceBaseUrl(),
        serviceReachable: true,
      });
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  if (segment === "qr") {
    try {
      const data = await getWhatsappQr();
      return NextResponse.json({ ...data, serviceReachable: true });
    } catch (err) {
      const fallback = await getFallbackSessionFromDb();
      const message =
        err instanceof WhatsappServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "WhatsApp error";

      return NextResponse.json({
        ...fallback,
        serviceReachable: false,
        serviceError: message,
        serviceUrl: getWhatsappServiceBaseUrl(),
      });
    }
  }

  if (segment === "status") {
    try {
      const data = await getWhatsappQr();
      return NextResponse.json({ ...data, serviceReachable: true });
    } catch (err) {
      const fallback = await getFallbackSessionFromDb();
      const message =
        err instanceof WhatsappServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "WhatsApp error";

      return NextResponse.json({
        ...fallback,
        serviceReachable: false,
        serviceError: message,
      });
    }
  }

  return jsonError("Not found", 404);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  if (!(await requireAdminApi())) return jsonError("Forbidden", 403);

  const { path = [] } = await params;
  const segment = path.join("/");

  if (segment === "reconnect") {
    try {
      const data = await reconnectWhatsapp();
      return NextResponse.json(data);
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  if (segment === "logout") {
    try {
      const data = await logoutWhatsapp();
      return NextResponse.json(data);
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  return jsonError("Not found", 404);
}
