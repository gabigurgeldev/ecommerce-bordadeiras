import sanitizeHtml from "sanitize-html";

const defaultOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, defaultOptions).trim();
}

export function sanitizeEmail(input: string): string {
  return sanitizeText(input).toLowerCase();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  stringKeys: (keyof T)[]
): T {
  const out = { ...obj };
  for (const key of stringKeys) {
    const val = out[key];
    if (typeof val === "string") {
      (out as Record<string, unknown>)[key as string] = sanitizeText(val);
    }
  }
  return out;
}
