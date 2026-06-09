export type MpApiErrorPayload = {
  message?: string;
  error?: string;
  status?: number;
  cause?: Array<{ code?: number | string; description?: string }>;
  errors?: Array<{
    code?: string;
    message?: string;
    details?: string[];
  }>;
};

export function parseMpApiErrorPayload(data: unknown, httpStatus?: number): string {
  if (!data || typeof data !== "object") {
    return httpStatus ? `Mercado Pago HTTP ${httpStatus}` : "Erro no Mercado Pago";
  }

  const err = data as MpApiErrorPayload;

  if (httpStatus === 409) {
    return "Esta tentativa de pagamento já foi enviada. Clique em Pagar novamente.";
  }

  if (httpStatus === 402) {
    const orderErrors = (err.errors ?? [])
      .map((e) => e.message ?? e.details?.join("; "))
      .filter(Boolean);
    if (orderErrors.length > 0) {
      return orderErrors.join("; ");
    }
    return (
      "Pagamento recusado pelo Mercado Pago. Em sandbox, use APRO como nome do titular " +
      "do cartão para simular aprovação."
    );
  }

  const causes = err.cause ?? [];
  const first = causes[0];

  if (first?.code === 2198 || /invalid test user email/i.test(first?.description ?? "")) {
    return (
      "E-mail de teste inválido. Use o e-mail exato de Contas de teste no Mercado Pago " +
      "(formato test_user_123456789@testuser.com), não invente um @testuser.com."
    );
  }

  if (first?.code === 3 || /token must be for test/i.test(first?.description ?? "")) {
    return "O Access Token deve ser de teste (seção Testes → Credenciais de teste).";
  }

  const details = causes
    .map((c) => c.description ?? (c.code != null ? String(c.code) : ""))
    .filter(Boolean)
    .join("; ");

  const orderErrors = (err.errors ?? [])
    .map((e) => e.message ?? e.details?.join("; "))
    .filter(Boolean)
    .join("; ");

  if (orderErrors) return orderErrors;
  if (details) return details;
  if (err.message) return err.message;
  if (httpStatus) return `Mercado Pago HTTP ${httpStatus}`;
  return "Falha ao processar pagamento no Mercado Pago";
}

export function isMpTestUserEmail(email: string): boolean {
  return /^test_user_[a-z0-9]+@testuser\.com$/i.test(email.trim());
}

/** CPF usado nos exemplos oficiais do MP para pagamentos de teste. */
export const MP_SANDBOX_TEST_CPF = "12345678909";
