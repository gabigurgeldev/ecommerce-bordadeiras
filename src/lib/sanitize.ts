import sanitizeHtml from "sanitize-html";

const defaultOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

const allowedUrlSchemes = ["http", "https", "mailto", "tel"];

const productHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: allowedUrlSchemes,
};

const utilityHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ["strong", "b", "em", "i", "br", "span", "a"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: allowedUrlSchemes,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

const blogHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "h2",
    "h3",
    "h4",
    "img",
    "figure",
    "figcaption",
    "code",
    "pre",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: allowedUrlSchemes,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, defaultOptions).trim();
}

export function sanitizeProductHtml(input: string): string {
  return sanitizeHtml(input, productHtmlOptions).trim();
}

export function sanitizeUtilityHtml(input: string): string {
  return sanitizeHtml(input, utilityHtmlOptions).trim();
}

export function sanitizeBlogHtml(input: string): string {
  return sanitizeHtml(input, blogHtmlOptions).trim();
}

export function sanitizeUrl(input: string | null | undefined): string | null {
  const value = input?.trim();
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  if (value.startsWith("#")) {
    return value;
  }

  try {
    const url = new URL(value);
    return allowedUrlSchemes.includes(url.protocol.replace(":", "")) ? value : null;
  } catch {
    return null;
  }
}

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
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
