/** Decode JWT exp (seconds) from Melhor Envio access token. */
export function decodeMelhorEnvioTokenExpiry(token: string): number | null {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > 0
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

export function formatMelhorEnvioExpiry(expiresAt: number | null): string | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
