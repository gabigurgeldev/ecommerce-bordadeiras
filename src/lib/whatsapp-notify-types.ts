import { ingestWhatsappLog } from "@/lib/whatsapp-client";

export type WhatsappDualNotifyResult = {
  ok: boolean;
  adminNotified: boolean;
  adminRecipientsSent?: number;
  adminWarning?: string;
  notifiedCustomer?: boolean;
  customerError?: string;
};

export type WhatsappTestAdminResult = {
  ok: boolean;
  sent: boolean;
  recipientsSent?: number;
  skipped?: number;
  error?: string;
};

function shortOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

export function ingestWhatsappHookError(hook: string, orderId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  ingestWhatsappLog({
    level: "error",
    category: "notify",
    message: `${hook} falhou`,
    meta: {
      hook,
      orderId: shortOrderId(orderId),
      error: message,
    },
  });
}

export function logAdminNotifyResult(
  hook: string,
  orderId: string,
  result: WhatsappDualNotifyResult,
) {
  const orderShort = shortOrderId(orderId);

  if (result.adminNotified) {
    ingestWhatsappLog({
      level: "success",
      category: "notify",
      message: `${hook} — admin notificado`,
      meta: {
        hook,
        orderId: orderShort,
        recipientsSent: result.adminRecipientsSent ?? 0,
        customerNotified: result.notifiedCustomer ?? false,
      },
    });
  } else {
    ingestWhatsappLog({
      level: "warn",
      category: "notify",
      message: `${hook} — admin não notificado`,
      meta: {
        hook,
        orderId: orderShort,
        warning: result.adminWarning ?? "motivo desconhecido",
      },
    });
  }

  if (result.customerError) {
    ingestWhatsappLog({
      level: "warn",
      category: "notify",
      message: `${hook} — cliente não notificado`,
      meta: {
        hook,
        orderId: orderShort,
        error: result.customerError,
      },
    });
  }
}
