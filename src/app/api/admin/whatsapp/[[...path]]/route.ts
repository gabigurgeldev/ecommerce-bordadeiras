import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin-auth";
import {
  getWhatsappQr,
  logoutWhatsapp,
  reconnectWhatsapp,
  checkWhatsappServiceHealth,
  sendTestAdminAlert,
  getWhatsappLogs,
  openWhatsappLogStream,
} from "@/lib/whatsapp-client";
import { jsonError } from "@/lib/api-utils";
import { WhatsappServiceError } from "@/lib/whatsapp-fetch";
import { getWhatsappServiceBaseUrl } from "@/lib/whatsapp-service-url";

export const dynamic = "force-dynamic";

async function requireAdminApi() {
  const actor = await getAdminActor();
  if (!actor) return null;
  return actor;
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

  if (segment === "logs") {
    try {
      const data = await getWhatsappLogs();
      return NextResponse.json({ ...data, serviceReachable: true });
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  if (segment === "logs/stream") {
    try {
      const upstream = await openWhatsappLogStream();
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-store, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  if (segment === "qr" || segment === "status") {
    try {
      const data = await getWhatsappQr();
      return NextResponse.json({ ...data, serviceReachable: true });
    } catch (err) {
      const message =
        err instanceof WhatsappServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "WhatsApp error";

      return NextResponse.json({
        status: "disconnected",
        qr: undefined,
        stale: true,
        serviceReachable: false,
        serviceError: message,
        serviceUrl: getWhatsappServiceBaseUrl(),
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

  if (segment === "send-test-admin") {
    try {
      const data = await sendTestAdminAlert();
      return NextResponse.json(data);
    } catch (err) {
      return whatsappServiceErrorResponse(err);
    }
  }

  return jsonError("Not found", 404);
}
