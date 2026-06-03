import { prisma } from "@/lib/prisma";

const CHECK_TIMEOUT_MS = 1_500;

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Banco de dados indisponível. Verifique se o PostgreSQL está acessível e se DATABASE_URL está correta.";

let cached: boolean | undefined;
let inflight: Promise<boolean> | null = null;

/**
 * Fast, cached check used in dev/preview when the database may be offline.
 * Avoids stacking Prisma connection timeouts on every layout render.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("db-timeout")), CHECK_TIMEOUT_MS),
        ),
      ]);
      cached = true;
    } catch {
      cached = false;
    }
    return cached;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
