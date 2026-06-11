type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function asPostgrestError(err: unknown): PostgrestErrorLike | null {
  if (!err || typeof err !== "object") return null;
  const e = err as PostgrestErrorLike;
  if (typeof e.message === "string") return e;
  return null;
}

/** Mensagem amigável para erros do Supabase/PostgREST (sem vazar segredos). */
export function formatSupabaseError(err: unknown): string {
  const pg = asPostgrestError(err);
  const message = pg?.message ?? (err instanceof Error ? err.message : String(err));
  const code = pg?.code ?? "";
  const lower = message.toLowerCase();

  if (
    lower.includes("does not exist") ||
    lower.includes("column") && lower.includes("order")
  ) {
    return "Banco de dados desatualizado. Aplique as migrations pendentes no Supabase.";
  }

  if (code === "23503" || lower.includes("foreign key")) {
    return "Produto ou variação inválido no carrinho.";
  }

  if (code === "23505" || lower.includes("unique constraint")) {
    return "Conflito ao gerar pedido. Tente novamente.";
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return "Sem permissão para salvar o pedido. Verifique a configuração do banco.";
  }

  if (message.trim()) {
    return message.length > 200 ? `${message.slice(0, 200)}…` : message;
  }

  return "Não foi possível salvar o pedido. Tente novamente.";
}
