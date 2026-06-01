"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/providers/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <QueryProvider>
          {children}
          <AppToaster />
        </QueryProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
