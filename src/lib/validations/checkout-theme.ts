import { z } from "zod";
import { DEFAULT_CHECKOUT_THEME } from "@/lib/checkout-theme";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, {
    message: "Cor inválida — use hex (#RRGGBB ou #RGB)",
  });

const cssValue = z.string().max(120);

const optionalUrl = z
  .string()
  .max(2048)
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || v.startsWith("data:") || /^https?:\/\//i.test(v),
    { message: "URL inválida — use https:// ou data URI" },
  );

/** Like optionalUrl but also accepts relative paths (starting with / or empty). */
const optionalPageUrl = z
  .string()
  .max(2048)
  .default("")
  .refine(
    (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
    { message: "URL inválida — use /caminho ou https://" },
  );

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const checkoutThemeColorsSchema = z.object({
  primary: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.primary),
  secondary: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.secondary),
  background: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.background),
  text: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.text),
  accent: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.accent),
  border: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.border),
  buttonBg: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.buttonBg),
  buttonText: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.buttonText),
  success: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.success),
  error: hexColor.default(DEFAULT_CHECKOUT_THEME.colors.error),
});

export const checkoutThemeTypographySchema = z.object({
  headingFont: cssValue.default(DEFAULT_CHECKOUT_THEME.typography.headingFont),
  bodyFont: cssValue.default(DEFAULT_CHECKOUT_THEME.typography.bodyFont),
  baseFontSize: z
    .string()
    .regex(/^\d+(\.\d+)?(px|rem|em)$/, { message: "Tamanho inválido (ex: 16px, 1rem)" })
    .default(DEFAULT_CHECKOUT_THEME.typography.baseFontSize),
});

export const checkoutThemeBrandingSchema = z.object({
  logoUrl: optionalUrl.default(DEFAULT_CHECKOUT_THEME.branding.logoUrl),
  faviconCheckout: optionalUrl.default(
    DEFAULT_CHECKOUT_THEME.branding.faviconCheckout,
  ),
});

export const checkoutThemeTrustBadgesSchema = z.object({
  securePayment: z.boolean().default(
    DEFAULT_CHECKOUT_THEME.icons.trustBadges.securePayment,
  ),
  sslCertificate: z.boolean().default(
    DEFAULT_CHECKOUT_THEME.icons.trustBadges.sslCertificate,
  ),
  moneyBackGuarantee: z.boolean().default(
    DEFAULT_CHECKOUT_THEME.icons.trustBadges.moneyBackGuarantee,
  ),
  fastShipping: z.boolean().default(
    DEFAULT_CHECKOUT_THEME.icons.trustBadges.fastShipping,
  ),
  customerSupport: z.boolean().default(
    DEFAULT_CHECKOUT_THEME.icons.trustBadges.customerSupport,
  ),
});

export const checkoutThemeIconsSchema = z.object({
  trustBadges: checkoutThemeTrustBadgesSchema.default({}),
  paymentIconStyle: z
    .enum(["color", "mono"])
    .default(DEFAULT_CHECKOUT_THEME.icons.paymentIconStyle),
});

export const checkoutThemeCtaSchema = z.object({
  placeOrderLabel: z
    .string()
    .min(1)
    .max(80)
    .default(DEFAULT_CHECKOUT_THEME.cta.placeOrderLabel),
  continueToPaymentLabel: z
    .string()
    .min(1)
    .max(80)
    .default(DEFAULT_CHECKOUT_THEME.cta.continueToPaymentLabel),
  urgencyText: z.string().max(200).default(DEFAULT_CHECKOUT_THEME.cta.urgencyText),
  trustMessages: z
    .array(z.string().min(1).max(200))
    .max(10, { message: "Máximo de 10 mensagens de confiança" })
    .default(DEFAULT_CHECKOUT_THEME.cta.trustMessages),
  returnPolicyUrl: optionalPageUrl.default(DEFAULT_CHECKOUT_THEME.cta.returnPolicyUrl),
});

export const checkoutThemeStepperSchema = z.object({
  showStepper: z.boolean().default(DEFAULT_CHECKOUT_THEME.stepper.showStepper),
});

export const checkoutThemeFooterSchema = z.object({
  showFooterLinks: z.boolean().default(DEFAULT_CHECKOUT_THEME.footer.showFooterLinks),
  privacyUrl: optionalPageUrl.default(DEFAULT_CHECKOUT_THEME.footer.privacyUrl),
  termsUrl: optionalPageUrl.default(DEFAULT_CHECKOUT_THEME.footer.termsUrl),
});

export const checkoutThemeLayoutSchema = z.object({
  borderRadius: cssValue.default(DEFAULT_CHECKOUT_THEME.layout.borderRadius),
  cardShadow: cssValue.default(DEFAULT_CHECKOUT_THEME.layout.cardShadow),
  spacingUnit: z.coerce
    .number()
    .int()
    .min(4)
    .max(64)
    .default(DEFAULT_CHECKOUT_THEME.layout.spacingUnit),
});

// ---------------------------------------------------------------------------
// Root schema (full / partial variants)
// ---------------------------------------------------------------------------

/** Full schema — every field has a default so it always parses successfully from {}. */
export const checkoutThemeSchema = z.object({
  colors: checkoutThemeColorsSchema.default({}),
  typography: checkoutThemeTypographySchema.default({}),
  branding: checkoutThemeBrandingSchema.default({}),
  icons: checkoutThemeIconsSchema.default({}),
  cta: checkoutThemeCtaSchema.default({}),
  layout: checkoutThemeLayoutSchema.default({}),
  stepper: checkoutThemeStepperSchema.default({}),
  footer: checkoutThemeFooterSchema.default({}),
});

export type CheckoutThemeInput = z.input<typeof checkoutThemeSchema>;
export type CheckoutThemeOutput = z.output<typeof checkoutThemeSchema>;

/** Partial schema for PATCH-style updates — all top-level sections optional. */
export const partialCheckoutThemeSchema = checkoutThemeSchema.partial();
export type PartialCheckoutThemeInput = z.input<typeof partialCheckoutThemeSchema>;
