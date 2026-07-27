import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-[var(--color-card-border)] bg-white px-6 py-16 text-center shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]">
          <FileQuestion className="h-8 w-8 text-[var(--color-price)]" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-[var(--color-brown)] sm:text-3xl">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          O endereço que você abriu não existe ou o conteúdo saiu do ar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Página inicial
          </Link>
          <Link
            href="/loja"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
          >
            Ver a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
