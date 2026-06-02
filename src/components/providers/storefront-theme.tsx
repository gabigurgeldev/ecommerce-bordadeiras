"use client";

import { ThemeProvider } from "next-themes";

/** Vitrine sempre em tema claro — ignora preferência do SO. */
export function StorefrontTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      storageKey="bordadeiras-storefront"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
