"use client";

import dynamic from "next/dynamic";
import type { CheckoutTheme } from "@/lib/checkout-theme";
import { Skeleton } from "@/components/ui/skeleton";

const CheckoutThemeEditor = dynamic(
  () =>
    import("@/components/admin/checkout-theme-editor").then(
      (mod) => mod.CheckoutThemeEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-56px)] flex-col gap-4 bg-background p-4">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="flex min-h-0 flex-1 gap-4">
          <Skeleton className="hidden h-full w-44 shrink-0 md:block" />
          <Skeleton className="h-full flex-1" />
          <Skeleton className="hidden h-full flex-1 lg:block" />
        </div>
      </div>
    ),
  },
);

export function CheckoutThemeEditorLauncher({
  initialTheme,
}: {
  initialTheme: CheckoutTheme;
}) {
  return <CheckoutThemeEditor initialTheme={initialTheme} />;
}
