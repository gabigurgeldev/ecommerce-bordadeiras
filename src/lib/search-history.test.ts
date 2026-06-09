import { describe, it, expect, beforeEach } from "vitest";
import { addSearchHistory, getSearchHistory } from "@/lib/search-history";

describe("search history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves recent searches", () => {
    addSearchHistory("bordadeira");
    addSearchHistory("linha polyester");
    const history = getSearchHistory();
    expect(history[0]).toBe("linha polyester");
    expect(history[1]).toBe("bordadeira");
  });

  it("deduplicates case-insensitively", () => {
    addSearchHistory("Bordadeira");
    addSearchHistory("bordadeira");
    expect(getSearchHistory()).toHaveLength(1);
  });
});
