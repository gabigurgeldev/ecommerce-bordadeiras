import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppOrigin, resolveMercadoPagoNotificationUrl } from "./app-url";

describe("app-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getAppOrigin falls back to localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("getAppOrigin normalizes https URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://loja.exemplo.com.br/");
    expect(getAppOrigin()).toBe("https://loja.exemplo.com.br");
  });

  it("resolveMercadoPagoNotificationUrl returns undefined for localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(resolveMercadoPagoNotificationUrl()).toBeUndefined();
  });

  it("resolveMercadoPagoNotificationUrl returns undefined for http production host", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://loja.exemplo.com.br");
    expect(resolveMercadoPagoNotificationUrl()).toBeUndefined();
  });

  it("resolveMercadoPagoNotificationUrl returns webhook for valid https", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://loja.exemplo.com.br");
    expect(resolveMercadoPagoNotificationUrl()).toBe(
      "https://loja.exemplo.com.br/api/webhooks/mercadopago",
    );
  });
});
