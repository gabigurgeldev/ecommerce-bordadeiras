const STORAGE_KEY = "bordadeiras-search-history";
const MAX_ITEMS = 8;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string").slice(0, MAX_ITEMS)
      : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  const trimmed = query.trim();
  if (trimmed.length < 2 || typeof window === "undefined") return;
  const current = getSearchHistory().filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...current].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
