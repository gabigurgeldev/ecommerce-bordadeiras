export type MelhorEnvioHttpResponse = {
  status: number;
  contentType: string;
  body: string;
};

const DEFAULT_TIMEOUT_MS = 20_000;

const BASE_HEADERS: Record<string, string> = {
  Accept: "application/json, */*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("abort") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("enetunreach") ||
    msg.includes("eai_again") ||
    msg.includes("fetch failed")
  );
}

async function melhorEnvioFetchOnce(
  method: "GET" | "POST",
  url: string,
  headers: Record<string, string>,
  body?: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MelhorEnvioHttpResponse> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { ...BASE_HEADERS, ...headers },
      body,
      signal: controller.signal,
      // @ts-expect-error — Node.js fetch-only option; safe to ignore in browser bundles
      duplex: "half",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const resBody = await res.text();

    return {
      status: res.status,
      contentType,
      body: resBody,
    };
  } finally {
    clearTimeout(timerId);
  }
}

async function melhorEnvioFetch(
  method: "GET" | "POST",
  url: string,
  headers: Record<string, string>,
  body?: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MelhorEnvioHttpResponse> {
  try {
    return await melhorEnvioFetchOnce(method, url, headers, body, timeoutMs);
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    // single retry after transient failure
    return melhorEnvioFetchOnce(method, url, headers, body, timeoutMs);
  }
}

/** POST request to Melhor Envio. */
export function melhorEnvioHttpsPost(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MelhorEnvioHttpResponse> {
  return melhorEnvioFetch("POST", url, headers, body, timeoutMs);
}

/** GET request to Melhor Envio. */
export function melhorEnvioHttpsGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MelhorEnvioHttpResponse> {
  return melhorEnvioFetch("GET", url, headers, undefined, timeoutMs);
}
