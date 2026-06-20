import Redis from "ioredis";

let redis: Redis | null = null;

/** Optional Redis client for cache/queues. Returns null when REDIS_URL is unset. */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

/** Simple cache get/set stub for sessions or idempotency keys. */
export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;
  return client.get(`cache:${key}`);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds = 3600
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.set(`cache:${key}`, value, "EX", ttlSeconds);
}

export async function cacheSetIfAbsent(
  key: string,
  value: string,
  ttlSeconds = 3600,
): Promise<boolean> {
  const client = getRedis();
  if (!client) return true;
  const result = await client.set(`cache:${key}`, value, "EX", ttlSeconds, "NX");
  return result === "OK";
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(`cache:${key}`);
}
