"use client";

import { checkoutThemeToCss, type CheckoutTheme } from "@/lib/checkout-theme-css";
import {
  findFontByCss,
  googleFontsUrl,
} from "@/lib/fonts/checkout-font-catalog";
import { useEffect, useRef } from "react";

/**
 * Injects CSS custom properties scoped to `.checkout-root` so checkout
 * components can reference var(--co-*) tokens instead of hard-coded classes.
 * Updates in real-time when `theme` changes (e.g. admin live-preview).
 *
 * Also dynamically loads required Google Fonts for the active heading/body
 * fonts so they render correctly on both the storefront and admin preview.
 */
export function CheckoutThemeProvider({
  theme,
  children,
}: {
  theme: CheckoutTheme;
  children: React.ReactNode;
}) {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const css = checkoutThemeToCss(theme);

  // Inject/update --co-* CSS custom properties
  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement("style");
      el.id = "checkout-theme";
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = css;

    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, [css]);

  // Dynamically load Google Fonts for the selected heading + body fonts.
  // Uses a stable <link> ID per font so re-renders never duplicate requests.
  useEffect(() => {
    const cssFamilies = [
      theme.typography.headingFont,
      theme.typography.bodyFont,
    ];

    for (const cssFamily of cssFamilies) {
      const font = findFontByCss(cssFamily);
      if (!font) continue;

      const url = googleFontsUrl(font);
      if (!url) continue;

      const linkId = `gf-checkout-${font.id}`;
      if (document.getElementById(linkId)) continue;

      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
    // We intentionally do NOT remove the <link> on cleanup — fonts stay
    // cached and benefit every subsequent checkout render on this page.
  }, [theme.typography.headingFont, theme.typography.bodyFont]);

  return (
    <div
      className="checkout-root"
      style={
        theme.colors.background
          ? { backgroundColor: theme.colors.background }
          : undefined
      }
    >
      {children}
    </div>
  );
}
