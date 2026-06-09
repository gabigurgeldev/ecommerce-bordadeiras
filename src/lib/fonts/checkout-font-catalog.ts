/**
 * Curated font catalog for the checkout theme editor.
 * Covers Brazilian e-commerce use cases: clean sans-serifs for body copy,
 * expressive serifs/display faces for headings, and safe system fallbacks.
 *
 * Strategy: fonts are loaded dynamically via Google Fonts CSS API
 * (Option B) — the CheckoutThemeProvider injects a <link> for the active
 * fonts on both the storefront and admin live-preview.
 */

export type FontCategory = "sans" | "serif" | "display" | "system";

export interface CheckoutFont {
  /** Unique stable ID — used for deduplicating injected <link> tags. */
  id: string;
  /** Human-readable label shown in the picker. */
  label: string;
  /**
   * Google Fonts family name (used to build the Fonts API URL).
   * null = system font; no network load needed.
   */
  googleFontFamily: string | null;
  /** Weights to request from Google Fonts. */
  weights: string[];
  /** Visual category used by the category filter in the picker. */
  category: FontCategory;
  /**
   * Full CSS font-family value stored in the theme DB.
   * Kept backward-compatible with the old inline FONT_OPTIONS strings.
   */
  cssFamily: string;
}

export const CHECKOUT_FONT_CATALOG: CheckoutFont[] = [
  // ── System (no network load) ────────────────────────────────────────────
  {
    id: "system-ui",
    label: "System UI",
    googleFontFamily: null,
    weights: [],
    category: "system",
    cssFamily: "system-ui, sans-serif",
  },
  {
    id: "georgia",
    label: "Georgia",
    googleFontFamily: null,
    weights: [],
    category: "system",
    cssFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "courier-new",
    label: "Courier New",
    googleFontFamily: null,
    weights: [],
    category: "system",
    cssFamily: "'Courier New', Courier, monospace",
  },

  // ── Sans-serif ──────────────────────────────────────────────────────────
  {
    id: "inter",
    label: "Inter",
    googleFontFamily: "Inter",
    weights: ["400", "500", "600", "700"],
    category: "sans",
    cssFamily: "Inter, system-ui, sans-serif",
  },
  {
    id: "poppins",
    label: "Poppins",
    googleFontFamily: "Poppins",
    weights: ["300", "400", "500", "600", "700"],
    category: "sans",
    cssFamily: "Poppins, sans-serif",
  },
  {
    id: "roboto",
    label: "Roboto",
    googleFontFamily: "Roboto",
    weights: ["400", "500", "700"],
    category: "sans",
    cssFamily: "Roboto, Arial, sans-serif",
  },
  {
    id: "open-sans",
    label: "Open Sans",
    googleFontFamily: "Open Sans",
    weights: ["400", "600", "700"],
    category: "sans",
    cssFamily: "'Open Sans', sans-serif",
  },
  {
    id: "lato",
    label: "Lato",
    googleFontFamily: "Lato",
    weights: ["400", "700"],
    category: "sans",
    cssFamily: "Lato, sans-serif",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    googleFontFamily: "Montserrat",
    weights: ["400", "500", "600", "700"],
    category: "sans",
    cssFamily: "Montserrat, sans-serif",
  },
  {
    id: "nunito",
    label: "Nunito",
    googleFontFamily: "Nunito",
    weights: ["400", "600", "700"],
    category: "sans",
    cssFamily: "Nunito, sans-serif",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    googleFontFamily: "DM Sans",
    weights: ["400", "500", "700"],
    category: "sans",
    cssFamily: "'DM Sans', sans-serif",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    googleFontFamily: "Plus Jakarta Sans",
    weights: ["400", "500", "600", "700"],
    category: "sans",
    cssFamily: "'Plus Jakarta Sans', sans-serif",
  },
  {
    id: "raleway",
    label: "Raleway",
    googleFontFamily: "Raleway",
    weights: ["400", "500", "600", "700"],
    category: "sans",
    cssFamily: "Raleway, sans-serif",
  },
  {
    id: "outfit",
    label: "Outfit",
    googleFontFamily: "Outfit",
    weights: ["400", "500", "600", "700"],
    category: "sans",
    cssFamily: "Outfit, sans-serif",
  },

  // ── Serif ───────────────────────────────────────────────────────────────
  {
    id: "playfair-display",
    label: "Playfair Display",
    googleFontFamily: "Playfair Display",
    weights: ["400", "500", "600", "700"],
    category: "serif",
    cssFamily: "'Playfair Display', Georgia, serif",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    googleFontFamily: "Merriweather",
    weights: ["400", "700"],
    category: "serif",
    cssFamily: "Merriweather, Georgia, serif",
  },
  {
    id: "lora",
    label: "Lora",
    googleFontFamily: "Lora",
    weights: ["400", "500", "600", "700"],
    category: "serif",
    cssFamily: "Lora, Georgia, serif",
  },
  {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    googleFontFamily: "Cormorant Garamond",
    weights: ["400", "500", "600", "700"],
    category: "serif",
    cssFamily: "'Cormorant Garamond', Georgia, serif",
  },
  {
    id: "eb-garamond",
    label: "EB Garamond",
    googleFontFamily: "EB Garamond",
    weights: ["400", "500", "600", "700"],
    category: "serif",
    cssFamily: "'EB Garamond', Georgia, serif",
  },

  // ── Display / Decorative ─────────────────────────────────────────────────
  {
    id: "josefin-sans",
    label: "Josefin Sans",
    googleFontFamily: "Josefin Sans",
    weights: ["400", "600", "700"],
    category: "display",
    cssFamily: "'Josefin Sans', sans-serif",
  },
  {
    id: "quicksand",
    label: "Quicksand",
    googleFontFamily: "Quicksand",
    weights: ["400", "500", "600", "700"],
    category: "display",
    cssFamily: "Quicksand, sans-serif",
  },
  {
    id: "comfortaa",
    label: "Comfortaa",
    googleFontFamily: "Comfortaa",
    weights: ["400", "600", "700"],
    category: "display",
    cssFamily: "Comfortaa, sans-serif",
  },
  {
    id: "pacifico",
    label: "Pacifico",
    googleFontFamily: "Pacifico",
    weights: ["400"],
    category: "display",
    cssFamily: "Pacifico, cursive",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Google Fonts CSS URL for a single font with its declared weights. */
export function googleFontsUrl(font: CheckoutFont): string | null {
  if (!font.googleFontFamily) return null;
  const family = encodeURIComponent(font.googleFontFamily);
  const weights = font.weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;
}

/**
 * Build a single Google Fonts CSS URL that loads ALL catalog fonts at once.
 * Used by the admin editor to preview every font name in its own typeface.
 */
export function allCatalogFontsUrl(): string {
  const parts = CHECKOUT_FONT_CATALOG.filter((f) => f.googleFontFamily).map(
    (f) => {
      const family = encodeURIComponent(f.googleFontFamily!);
      const weights = f.weights.join(";");
      return `family=${family}:wght@${weights}`;
    },
  );
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

/** Find a font entry by its stored CSS font-family string. */
export function findFontByCss(cssFamily: string): CheckoutFont | undefined {
  return CHECKOUT_FONT_CATALOG.find((f) => f.cssFamily === cssFamily);
}

/** Find a font entry by its stable ID. */
export function findFontById(id: string): CheckoutFont | undefined {
  return CHECKOUT_FONT_CATALOG.find((f) => f.id === id);
}

/** Category label → Portuguese display string. */
export const CATEGORY_LABELS: Record<FontCategory | "all", string> = {
  all: "Todos",
  sans: "Sans-serif",
  serif: "Serif",
  display: "Display",
  system: "Sistema",
};
