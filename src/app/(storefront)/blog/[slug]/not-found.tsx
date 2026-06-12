import { BlogBreadcrumb } from "@/components/blog/blog-breadcrumb";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <BlogBreadcrumb
        items={[
          { label: "Página inicial", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Artigo não encontrado" },
        ]}
      />

      <div className="mx-auto mt-12 flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-[var(--color-card-border)] bg-white px-6 py-16 text-center shadow-sm sm:mt-16">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]">
          <FileQuestion className="h-8 w-8 text-[var(--color-price)]" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-[var(--color-brown)] sm:text-3xl">
          Artigo não encontrado
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          O conteúdo que você procura pode ter sido removido, renomeado ou ainda não foi
          publicado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar ao blog
          </Link>
          <Link
            href="/blog/busca"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
          >
            Buscar artigos
          </Link>
        </div>
      </div>
    </div>
  );
}
