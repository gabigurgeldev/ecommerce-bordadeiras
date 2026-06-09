import https from "node:https";
import { URL } from "node:url";

export type MelhorEnvioHttpResponse = {
  status: number;
  contentType: string;
  body: string;
};

/**
 * Direct HTTPS POST to Melhor Envio (bypasses Node fetch / HTTP_PROXY).
 * Matches the official PHP SDK which uses Guzzle without system proxy.
 */
export function melhorEnvioHttpsPost(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs = 15_000,
): Promise<MelhorEnvioHttpResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = Buffer.from(body, "utf8");

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": payload.length,
        },
        family: 4,
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
    req.write(payload);
    req.end();
  });
}
