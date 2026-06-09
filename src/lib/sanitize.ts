import sanitizeHtml from "sanitize-html";

const defaultOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

const productHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
};

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, defaultOptions).trim();
}

export function sanitizeProductHtml(input: string): string {
  return sanitizeHtml(input, productHtmlOptions).trim();
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
