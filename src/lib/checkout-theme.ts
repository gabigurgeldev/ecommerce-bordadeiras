/**
 * Checkout theme data layer.
 *
 * Stored as a single JSON blob under the Setting key `checkout.theme`.
 * All fields are optional at rest; missing fields fall back to DEFAULT_CHECKOUT_THEME.
 */

import { getSetting, setSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface CheckoutThemeColors {
  /** Primary brand color used for highlights and links. */
  primary: string;
  /** Secondary / accent-light color. */
  secondary: string;
  /** Page / canvas background. */
  background: string;
  /** Default body text color. */
  text: string;
  /** Accent color (badges, highlights). */
  accent: string;
  /** Border / divider color. */
  border: string;
  /** CTA button background. */
  buttonBg: string;
  /** CTA button text. */
  buttonText: string;
  /** Success state (confirmation tick, etc.). */
  success: string;
  /** Error state (validation messages). */
  error: string;
}

export interface CheckoutThemeTypography {
  /** Font family for headings (CSS font-family value). */
  headingFont: string;
  /** Font family for body copy. */
  bodyFont: string;
  /** Base font size (e.g. "16px"). */
  baseFontSize: string;
}

export interface CheckoutThemeBranding {
  /** Overrides the global store logo specifically for the checkout. */
  logoUrl: string;
  /** Favicon shown in the browser tab during checkout (URL or data URI). */
  faviconCheckout: string;
}

export interface CheckoutThemeIcons {
  /** Show/hide each trust-badge category in the checkout footer. */
  trustBadges: {
    securePayment: boolean;
    sslCertificate: boolean;
    moneyBackGuarantee: boolean;
    fastShipping: boolean;
    customerSupport: boolean;
  };
  /**
   * Visual style for the accepted-payment-method icons row.
   * "color" = full-color SVGs; "mono" = single-color (tinted with `colors.text`).
   */
  paymentIconStyle: "color" | "mono";
}

export interface CheckoutThemeCta {
  /** Label on the main "place order" button. */
  placeOrderLabel: string;
  /** Label on the "continue to payment" step button. */
  continueToPaymentLabel: string;
  /** Short urgency line shown above or near the CTA (empty = hidden). */
  urgencyText: string;
  /**
   * Rotating trust messages displayed below the cart summary.
   * Empty array disables the feature.
   */
  trustMessages: string[];
  /** URL to the return/refund policy page (empty = no link shown). */
  returnPolicyUrl: string;
}

export interface CheckoutThemeStepper {
  /** Show the visual progress stepper at the top of checkout. */
  showStepper: boolean;
}

export interface CheckoutThemeFooter {
  /** Show footer links (privacy / terms). */
  showFooterLinks: boolean;
  /** URL to the privacy policy page. */
  privacyUrl: string;
  /** URL to the terms of service page. */
  termsUrl: string;
}

export interface CheckoutThemeLayout {
  /** CSS border-radius token (e.g. "8px", "0.5rem"). */
  borderRadius: string;
  /** CSS box-shadow for cards/panels (e.g. "0 2px 8px rgba(0,0,0,.08)"). */
  cardShadow: string;
  /** Base spacing unit in px used for component padding/gap (numeric). */
  spacingUnit: number;
}

/** Full checkout theme shape. Every property has a guaranteed value thanks to mergeWithDefaults. */
export interface CheckoutTheme {
  colors: CheckoutThemeColors;
  typography: CheckoutThemeTypography;
  branding: CheckoutThemeBranding;
  icons: CheckoutThemeIcons;
  cta: CheckoutThemeCta;
  layout: CheckoutThemeLayout;
  stepper: CheckoutThemeStepper;
  footer: CheckoutThemeFooter;
}

/** Partial version suitable for DB storage (only overridden fields need to be stored). */
export type PartialCheckoutTheme = {
  colors?: Partial<CheckoutThemeColors>;
  typography?: Partial<CheckoutThemeTypography>;
  branding?: Partial<CheckoutThemeBranding>;
  icons?: Partial<{
    trustBadges?: Partial<CheckoutThemeIcons["trustBadges"]>;
    paymentIconStyle?: CheckoutThemeIcons["paymentIconStyle"];
  }>;
  cta?: Partial<CheckoutThemeCta>;
  layout?: Partial<CheckoutThemeLayout>;
  stepper?: Partial<CheckoutThemeStepper>;
  footer?: Partial<CheckoutThemeFooter>;
};

// ---------------------------------------------------------------------------
// Default theme
// ---------------------------------------------------------------------------

export const DEFAULT_CHECKOUT_THEME: CheckoutTheme = {
  colors: {
    primary: "#7C3AED",
    secondary: "#A78BFA",
    background: "#F9FAFB",
    text: "#111827",
    accent: "#F59E0B",
    border: "#E5E7EB",
    buttonBg: "#7C3AED",
    buttonText: "#FFFFFF",
    success: "#10B981",
    error: "#EF4444",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    baseFontSize: "16px",
  },
  branding: {
    logoUrl: "",
    faviconCheckout: "",
  },
  icons: {
    trustBadges: {
      securePayment: true,
      sslCertificate: true,
      moneyBackGuarantee: true,
      fastShipping: true,
      customerSupport: true,
    },
    paymentIconStyle: "color",
  },
  cta: {
    placeOrderLabel: "Finalizar pedido",
    continueToPaymentLabel: "Ir para pagamento",
    urgencyText: "",
    trustMessages: [
      "Compra 100% segura e protegida",
      "Seus dados estão criptografados",
      "Satisfação garantida ou seu dinheiro de volta",
    ],
    returnPolicyUrl: "",
  },
  layout: {
    borderRadius: "8px",
    cardShadow: "0 1px 4px rgba(0,0,0,0.08)",
    spacingUnit: 16,
  },
  stepper: {
    showStepper: true,
  },
  footer: {
    showFooterLinks: true,
    privacyUrl: "/privacidade",
    termsUrl: "/termos",
  },
};

// ---------------------------------------------------------------------------
// Merge helper (deep-merge partial over defaults)
// ---------------------------------------------------------------------------

export function mergeWithDefaults(partial: PartialCheckoutTheme): CheckoutTheme {
  return {
    colors: { ...DEFAULT_CHECKOUT_THEME.colors, ...partial.colors },
    typography: { ...DEFAULT_CHECKOUT_THEME.typography, ...partial.typography },
    branding: { ...DEFAULT_CHECKOUT_THEME.branding, ...partial.branding },
    icons: {
      paymentIconStyle:
        partial.icons?.paymentIconStyle ??
        DEFAULT_CHECKOUT_THEME.icons.paymentIconStyle,
      trustBadges: {
        ...DEFAULT_CHECKOUT_THEME.icons.trustBadges,
        ...partial.icons?.trustBadges,
      },
    },
    cta: { ...DEFAULT_CHECKOUT_THEME.cta, ...partial.cta },
    layout: { ...DEFAULT_CHECKOUT_THEME.layout, ...partial.layout },
    stepper: { ...DEFAULT_CHECKOUT_THEME.stepper, ...partial.stepper },
    footer: { ...DEFAULT_CHECKOUT_THEME.footer, ...partial.footer },
  };
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/**
 * Reads `checkout.theme` from the Setting table and merges with defaults.
 * Returns a fully-resolved CheckoutTheme — never throws; falls back to defaults on error.
 */
export async function getCheckoutThemeFromDb(): Promise<CheckoutTheme> {
  try {
    const raw = await getSetting(SETTING_KEYS.checkout.theme);
    if (!raw) return { ...DEFAULT_CHECKOUT_THEME };
    const parsed: PartialCheckoutTheme = JSON.parse(raw);
    return mergeWithDefaults(parsed);
  } catch {
    return { ...DEFAULT_CHECKOUT_THEME };
  }
}

/**
 * Persists a partial (or full) CheckoutTheme to the Setting table.
 * Only the supplied partial is stored; reads are always merged with defaults.
 */
export async function saveCheckoutThemeToDb(
  theme: PartialCheckoutTheme,
): Promise<void> {
  await setSettings({
    [SETTING_KEYS.checkout.theme]: JSON.stringify(theme),
  });
}
