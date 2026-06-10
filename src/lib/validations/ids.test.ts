import { describe, expect, it } from "vitest";
import { orderIdSchema } from "./ids";

describe("orderIdSchema", () => {
  it("accepts newId format", () => {
    const result = orderIdSchema.safeParse("cRrhMPRG3-gGtiAOi");
    expect(result.success).toBe(true);
  });

  it("accepts seed catalog ids", () => {
    expect(orderIdSchema.safeParse("prod_bordadeira_x12").success).toBe(true);
    expect(orderIdSchema.safeParse("cat_maquinas").success).toBe(true);
  });

  it("rejects invalid ids", () => {
    expect(orderIdSchema.safeParse("").success).toBe(false);
    expect(orderIdSchema.safeParse("order 123").success).toBe(false);
  });
});
