/**
 * Bridge module — re-exports the canonical CheckoutTheme from @/lib/checkout-theme
 * and adds:
 *  - CHECKOUT_THEME_DEFAULTS (alias for DEFAULT_CHECKOUT_THEME)
 *  - parseCheckoutTheme()   — safe JSON→CheckoutTheme deserialiser
 *  - checkoutThemeToCss()   — converts a CheckoutTheme to CSS custom properties
 *
 * This keeps backward compatibility for files that import these utilities from
 * "checkout-theme-css" while ensuring a single canonical type definition.
 */

import {
  DEFAULT_CHECKOUT_THEME,
  mergeWithDefaults,
  type CheckoutTheme,
  type PartialCheckoutTheme,
} from "@/lib/checkout-theme";

export type { CheckoutTheme };
export { DEFAULT_CHECKOUT_THEME as CHECKOUT_THEME_DEFAULTS };

/** Safely parse JSON stored in `checkout.theme` into a complete CheckoutTheme. */
export function parseCheckoutTheme(raw: string | undefined): CheckoutTheme {
  if (!raw) return { ...DEFAULT_CHECKOUT_THEME };
  try {
    const partial = JSON.parse(raw) as PartialCheckoutTheme;
    return mergeWithDefaults(partial);
  } catch {
    return { ...DEFAULT_CHECKOUT_THEME };
  }
}

/** Convert a full CheckoutTheme to a scoped CSS custom-properties block. */
export function checkoutThemeToCss(theme: CheckoutTheme): string {
  const { colors, layout, typography } = theme;
  const vars = [
    `--co-primary: ${colors.primary};`,
    `--co-secondary: ${colors.secondary};`,
    `--co-bg: ${colors.background};`,
    `--co-text: ${colors.text};`,
    `--co-accent: ${colors.accent};`,
    `--co-border: ${colors.border};`,
    `--co-btn-bg: ${colors.buttonBg};`,
    `--co-btn-text: ${colors.buttonText};`,
    `--co-success: ${colors.success};`,
    `--co-error: ${colors.error};`,
    `--co-radius: ${layout.borderRadius};`,
    `--co-shadow: ${layout.cardShadow};`,
    `--co-font-heading: ${typography.headingFont};`,
    `--co-font-body: ${typography.bodyFont};`,
    `--co-font-size: ${typography.baseFontSize};`,
  ];
  return `.checkout-root { ${vars.join(" ")} }`;
}
