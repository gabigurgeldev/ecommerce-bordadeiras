import https from "node:https";
import { URL } from "node:url";

export type MelhorEnvioHttpResponse = {
  status: number;
  contentType: string;
  body: string;
};

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("enetunreach") ||
    msg.includes("eai_again")
  );
}

function melhorEnvioHttpsRequestOnce(
  method: "GET" | "POST",
  url: string,
  headers: Record<string, string>,
  body?: string,
  timeoutMs = 15_000,
): Promise<MelhorEnvioHttpResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(body, "utf8") : null;

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 443,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers: {
          ...headers,
          ...(payload ? { "Content-Length": payload.length } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            contentType: String(res.headers["content-type"] ?? ""),
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Melhor Envio request timeout"));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function melhorEnvioHttpsRequest(
  method: "GET" | "POST",
  url: string,
  headers: Record<string, string>,
  body?: string,
  timeoutMs = 15_000,
): Promise<MelhorEnvioHttpResponse> {
  try {
    return await melhorEnvioHttpsRequestOnce(method, url, headers, body, timeoutMs);
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    return melhorEnvioHttpsRequestOnce(method, url, headers, body, timeoutMs);
  }
}

/** Direct HTTPS POST (bypasses Node fetch / HTTP_PROXY). */
export function melhorEnvioHttpsPost(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs = 15_000,
): Promise<MelhorEnvioHttpResponse> {
  return melhorEnvioHttpsRequest("POST", url, headers, body, timeoutMs);
}

/** Direct HTTPS GET (bypasses Node fetch / HTTP_PROXY). */
export function melhorEnvioHttpsGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 15_000,
): Promise<MelhorEnvioHttpResponse> {
  return melhorEnvioHttpsRequest("GET", url, headers, undefined, timeoutMs);
}
