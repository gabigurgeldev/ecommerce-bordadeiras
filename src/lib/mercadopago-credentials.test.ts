import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isValidMpCredentialFormat,
  mapMercadoPagoApiError,
  probeMpAccessTokenEnv,
  resolveSandboxPayerEmail,
  validateMpCredentialPair,
  verifyAccessTokenMatchesSandbox,
} from "./mercadopago-credentials";

describe("isValidMpCredentialFormat", () => {
  it("accepts APP_USR keys", () => {
    expect(isValidMpCredentialFormat("APP_USR-abc-123")).toBe(true);
  });

  it("accepts legacy TEST keys", () => {
    expect(isValidMpCredentialFormat("TEST-abc-123")).toBe(true);
  });

  it("rejects unknown format", () => {
    expect(isValidMpCredentialFormat("pk_live_123")).toBe(false);
  });
});

describe("validateMpCredentialPair", () => {
  it("accepts APP_USR pair", () => {
    const result = validateMpCredentialPair({
      publicKey: "APP_USR-6695991557259269-pk",
      accessToken: "APP_USR-6695991557259269-at",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts legacy TEST pair", () => {
    const result = validateMpCredentialPair({
      publicKey: "TEST-123456-pk",
      accessToken: "TEST-123456-at",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing public key", () => {
    const result = validateMpCredentialPair({
      publicKey: "",
      accessToken: "APP_USR-at",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/Public Key/i);
  });

  it("rejects missing access token", () => {
    const result = validateMpCredentialPair({
      publicKey: "APP_USR-pk",
      accessToken: "",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/Access Token/i);
  });

  it("rejects invalid public key format", () => {
    const result = validateMpCredentialPair({
      publicKey: "pk_live_123",
      accessToken: "APP_USR-at",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/inválida/i);
  });
});

describe("resolveSandboxPayerEmail", () => {
  it("converts real email to testuser.com", () => {
    expect(resolveSandboxPayerEmail("gabriel@gmail.com")).toBe(
      "test_user_gabriel@testuser.com",
    );
  });

  it("keeps existing testuser email", () => {
    expect(resolveSandboxPayerEmail("test_user_1@testuser.com")).toBe(
      "test_user_1@testuser.com",
    );
  });
});

describe("mapMercadoPagoApiError", () => {
  it("explains live credentials in sandbox mode", () => {
    const msg = mapMercadoPagoApiError("Unauthorized use of live credentials", true);
    expect(msg).toMatch(/sandbox ativo/i);
  });

  it("explains test credentials in production mode", () => {
    const msg = mapMercadoPagoApiError("Unauthorized use of live credentials", false);
    expect(msg).toMatch(/produção/i);
  });

  it("returns raw error when not about credentials", () => {
    const msg = mapMercadoPagoApiError("Some other error", true);
    expect(msg).toBe("Some other error");
  });
});

describe("probeMpAccessTokenEnv", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects production via live_mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ live_mode: true }),
      })),
    );

    const probe = await probeMpAccessTokenEnv("APP_USR-token");
    expect(probe.env).toBe("production");
  });

  it("detects test via live_mode false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ live_mode: false }),
      })),
    );

    const probe = await probeMpAccessTokenEnv("APP_USR-token");
    expect(probe.env).toBe("test");
  });

  it("detects test via test_data.test_user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ test_data: { test_user: true }, tags: ["test_user"] }),
      })),
    );

    const probe = await probeMpAccessTokenEnv("APP_USR-token");
    expect(probe.env).toBe("test");
  });
});

describe("verifyAccessTokenMatchesSandbox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects production token when sandbox is active", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ live_mode: true }),
      })),
    );

    const result = await verifyAccessTokenMatchesSandbox("APP_USR-prod", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/PRODUÇÃO/i);
  });

  it("accepts test token in sandbox", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ live_mode: false }),
      })),
    );

    const result = await verifyAccessTokenMatchesSandbox("APP_USR-test", true);
    expect(result.ok).toBe(true);
  });
});
