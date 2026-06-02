import { Ratelimit } from "@upstash/ratelimit";
import { Redis as UpstashRedis } from "@upstash/redis";

type RateLimitResult = { success: boolean; remaining?: number };

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { success: false, remaining: 0 };
  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

function createUpstashLimiter(
  prefix: string,
  requests: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`
) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new UpstashRedis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  });
}

const authLimiter = createUpstashLimiter("auth", 10, "1 m");
const webhookLimiter = createUpstashLimiter("webhook", 60, "1 m");

export async function rateLimitAuth(identifier: string): Promise<RateLimitResult> {
  if (authLimiter) {
    const r = await authLimiter.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryRateLimit(`auth:${identifier}`, 10, 60_000);
}

/** Credentials sign-in — keyed by normalized email. */
export async function rateLimitLogin(email: string): Promise<RateLimitResult> {
  const key = email.trim().toLowerCase();
  return rateLimitAuth(`login:${key}`);
}

export async function rateLimitWebhook(identifier: string): Promise<RateLimitResult> {
  if (webhookLimiter) {
    const r = await webhookLimiter.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryRateLimit(`webhook:${identifier}`, 60, 60_000);
}
