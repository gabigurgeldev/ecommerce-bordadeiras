"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-[var(--color-card-border)] bg-white px-6 py-16 text-center shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]">
          <AlertTriangle className="h-8 w-8 text-[var(--color-price)]" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-[var(--color-brown)] sm:text-3xl">
          Algo deu errado
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          Não conseguimos carregar esta página agora. Tente novamente em instantes.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
          >
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
