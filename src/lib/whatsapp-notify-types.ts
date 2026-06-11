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

export function logAdminNotifyResult(
  hook: string,
  orderId: string,
  result: WhatsappDualNotifyResult,
) {
  if (!result.adminNotified) {
    console.warn(
      `[${hook}] admin not notified for order ${orderId}:`,
      result.adminWarning ?? "unknown reason",
    );
  }
  if (result.customerError) {
    console.warn(`[${hook}] customer notify failed for order ${orderId}:`, result.customerError);
  }
}
