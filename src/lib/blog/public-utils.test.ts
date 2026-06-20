import { describe, expect, it } from "vitest";
import { highlightSearchTerms, prepareArticleHtml } from "./public-utils";

describe("blog public utils", () => {
  it("sanitizes unsafe article HTML before rendering", () => {
    const html = prepareArticleHtml(
      '<h2 onclick="alert(1)">Título</h2><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)" />',
    );

    expect(html).toContain('<h2 id="titulo">Título</h2>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("escapes text before adding allowed highlight markup", () => {
    const html = highlightSearchTerms('Costura <img src=x onerror="alert(1)"> fina', "costura");

    expect(html).toContain(
      '<mark class="rounded bg-[var(--color-price)]/25 px-0.5">Costura</mark>',
    );
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain("<img");
  });
});
