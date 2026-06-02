/**
 * AUTH_SECRET estável — evita 500 em /api/auth/session quando o .env está vazio em dev.
 */
export function getAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "dev-only-auth-secret-set-AUTH_SECRET-in-env";
  }

  return "";
}
