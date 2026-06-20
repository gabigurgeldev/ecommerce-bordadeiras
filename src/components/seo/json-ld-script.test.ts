import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld-script";

describe("serializeJsonLd", () => {
  it("escapes script-breaking and HTML-significant characters", () => {
    const json = serializeJsonLd({
      "@context": "https://schema.org",
      name: "</script><img src=x onerror=alert(1)>",
      text: "A & B \u2028 C \u2029 D",
    });

    expect(json).not.toContain("</script>");
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(json).not.toContain("&");
    expect(json).toContain("\\u003C/script\\u003E");
    expect(json).toContain("\\u0026");
    expect(json).toContain("\\u2028");
    expect(json).toContain("\\u2029");
  });
});
