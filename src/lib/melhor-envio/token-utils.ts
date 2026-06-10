function decodeJwtPayloadSegment(segment: string): Record<string, unknown> | null {
  const attempts: BufferEncoding[] = ["base64url", "base64"];
  for (const encoding of attempts) {
    try {
      const raw =
        encoding === "base64"
          ? segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=")
          : segment;
      return JSON.parse(Buffer.from(raw, encoding).toString("utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      /* try next encoding */
    }
  }
  return null;
}

/** Decode JWT exp (seconds) from Melhor Envio access token. */
export function decodeMelhorEnvioTokenExpiry(token: string): number | null {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  const payload = decodeJwtPayloadSegment(parts[1]);
  const exp = payload?.exp;
  return typeof exp === "number" && exp > 0 ? Math.floor(exp * 1000) : null;
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
