import { describe, expect, it } from "vitest";
import { isMpTestUserEmail, parseMpApiErrorPayload } from "./mercadopago-errors";

describe("isMpTestUserEmail", () => {
  it("accepts official MP test user format", () => {
    expect(isMpTestUserEmail("test_user_123456789@testuser.com")).toBe(true);
  });

  it("rejects invented @testuser.com emails", () => {
    expect(isMpTestUserEmail("gabrielgurgelpl@testuser.com")).toBe(false);
  });
});

describe("parseMpApiErrorPayload", () => {
  it("maps invalid test user email", () => {
    const msg = parseMpApiErrorPayload({
      cause: [{ code: 2198, description: "Invalid test user email" }],
    });
    expect(msg).toContain("Contas de teste");
  });

  it("maps 409 idempotency conflict", () => {
    const msg = parseMpApiErrorPayload({ message: "conflict" }, 409);
    expect(msg).toContain("já foi enviada");
  });

  it("maps 402 with order errors", () => {
    const msg = parseMpApiErrorPayload(
      { errors: [{ message: "Card rejected" }] },
      402,
    );
    expect(msg).toBe("Card rejected");
  });

  it("maps 402 without details to sandbox hint", () => {
    const msg = parseMpApiErrorPayload({}, 402);
    expect(msg).toContain("APRO");
  });
});
