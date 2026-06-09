"use server";

import { revalidatePath } from "next/cache";
import {
  getCheckoutThemeFromDb,
  saveCheckoutThemeToDb,
  DEFAULT_CHECKOUT_THEME,
  mergeWithDefaults,
  type CheckoutTheme,
  type PartialCheckoutTheme,
} from "@/lib/checkout-theme";
import {
  checkoutThemeSchema,
  partialCheckoutThemeSchema,
} from "@/lib/validations/checkout-theme";
import {
  auditMutation,
  revalidateAdmin,
  withAdmin,
  withAdminRead,
  type ActionResult,
} from "./_utils";

// ---------------------------------------------------------------------------
// Admin — read
// ---------------------------------------------------------------------------

/**
 * Returns the fully-resolved checkout theme for the admin editor.
 * Merges DB-stored overrides with DEFAULT_CHECKOUT_THEME so the editor
 * always receives every field with a concrete value.
 */
export async function getCheckoutThemeSettings(): Promise<CheckoutTheme> {
  return withAdminRead(() => getCheckoutThemeFromDb());
}

// ---------------------------------------------------------------------------
// Admin — write (full replace)
// ---------------------------------------------------------------------------

/**
 * Validates and persists the full checkout theme.
 * The entire validated payload replaces whatever is currently in the DB.
 */
export async function saveCheckoutThemeSettings(
  data: unknown,
): Promise<ActionResult<CheckoutTheme>> {
  return withAdmin(async (actor) => {
    const parsed = checkoutThemeSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message ?? "Dados de tema inválidos";
      return { success: false, error: firstError };
    }

    const theme = parsed.data as PartialCheckoutTheme;
    await saveCheckoutThemeToDb(theme);

    await auditMutation(actor, {
      action: "SETTINGS_CHANGE",
      entity: "CheckoutTheme",
    });

    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout", "layout");

    const resolved = mergeWithDefaults(theme);
    return { success: true, data: resolved };
  });
}

// ---------------------------------------------------------------------------
// Admin — write (partial / PATCH-style)
// ---------------------------------------------------------------------------

/**
 * Merges a partial theme patch into the currently stored theme, then persists.
 * Useful for section-by-section editors (e.g. update only colors without
 * touching typography).
 */
export async function patchCheckoutThemeSettings(
  patch: unknown,
): Promise<ActionResult<CheckoutTheme>> {
  return withAdmin(async (actor) => {
    const parsed = partialCheckoutThemeSchema.safeParse(patch);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message ?? "Dados de tema inválidos";
      return { success: false, error: firstError };
    }

    const existing = await getCheckoutThemeFromDb();

    const merged: PartialCheckoutTheme = {
      colors: { ...existing.colors, ...parsed.data.colors },
      typography: { ...existing.typography, ...parsed.data.typography },
      branding: { ...existing.branding, ...parsed.data.branding },
      icons: {
        trustBadges: {
          ...existing.icons.trustBadges,
          ...parsed.data.icons?.trustBadges,
        },
        paymentIconStyle:
          parsed.data.icons?.paymentIconStyle ??
          existing.icons.paymentIconStyle,
      },
      cta: { ...existing.cta, ...parsed.data.cta },
      layout: { ...existing.layout, ...parsed.data.layout },
    };

    await saveCheckoutThemeToDb(merged);

    await auditMutation(actor, {
      action: "SETTINGS_CHANGE",
      entity: "CheckoutTheme",
      metadata: { patch: Object.keys(parsed.data) },
    });

    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout", "layout");

    const resolved = mergeWithDefaults(merged);
    return { success: true, data: resolved };
  });
}

// ---------------------------------------------------------------------------
// Admin — reset to defaults
// ---------------------------------------------------------------------------

/**
 * Deletes the stored theme overrides, effectively reverting to DEFAULT_CHECKOUT_THEME.
 * Persists an empty object so subsequent reads still return clean defaults.
 */
export async function resetCheckoutThemeToDefaults(): Promise<
  ActionResult<CheckoutTheme>
> {
  return withAdmin(async (actor) => {
    await saveCheckoutThemeToDb({});

    await auditMutation(actor, {
      action: "SETTINGS_CHANGE",
      entity: "CheckoutTheme",
      metadata: { reset: true },
    });

    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout", "layout");

    return { success: true, data: { ...DEFAULT_CHECKOUT_THEME } };
  });
}

// ---------------------------------------------------------------------------
// Storefront — public read (no auth required)
// ---------------------------------------------------------------------------

/**
 * Public-facing theme getter for use in checkout page components.
 * No admin auth is required; returns the merged theme or hard defaults on error.
 */
export async function getPublicCheckoutTheme(): Promise<CheckoutTheme> {
  try {
    return await getCheckoutThemeFromDb();
  } catch {
    return { ...DEFAULT_CHECKOUT_THEME };
  }
}
