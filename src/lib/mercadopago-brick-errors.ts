const BRICK_CAUSE_MESSAGES: Record<string, string> = {
  incomplete_fields: "Preencha todos os campos do cartão corretamente.",
  card_token_creation_failed:
    "Falha ao tokenizar o cartão. Confira a Public Key de teste no admin (Testes → Credenciais de teste).",
  secure_fields_card_token_creation_failed:
    "Falha ao tokenizar o cartão. Confira a Public Key de teste no admin.",
  incorrect_initialization:
    "Erro ao inicializar o formulário. Recarregue a página e tente novamente.",
  unauthorized_payment_method:
    "Método de cartão não autorizado para esta Public Key.",
  invalid_sdk_instance:
    "SDK do Mercado Pago inválido. Recarregue a página.",
};

export function formatMercadoPagoBrickError(err: unknown): string {
  if (!err) {
    return "Não foi possível processar o cartão. Revise os dados e tente novamente.";
  }
  if (typeof err === "string" && err.trim()) return err;
  if (err instanceof Error && err.message.trim()) return err.message;

  const record = err as Record<string, unknown>;
  const cause = record.cause;
  if (typeof cause === "string" && BRICK_CAUSE_MESSAGES[cause]) {
    return BRICK_CAUSE_MESSAGES[cause];
  }

  const message = record.message;
  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(err) && err.length > 0) {
    return "Revise os dados do cartão e tente novamente.";
  }

  if (typeof err === "object" && Object.keys(record).length === 0) {
    return "Revise os dados do cartão. Em sandbox, use CPF 12345678909 e cartão de teste do Mercado Pago.";
  }

  return "Não foi possível processar o cartão. Revise os dados e tente novamente.";
}

export function isCriticalBrickError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as { type?: string }).type === "critical";
}
