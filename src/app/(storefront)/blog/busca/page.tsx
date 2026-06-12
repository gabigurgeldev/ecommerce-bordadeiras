import { BlogBreadcrumb } from "@/components/blog/blog-breadcrumb";
import { BlogSearchClient } from "@/components/blog/blog-search-client";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getPublicBlogCategories } from "@/actions/blog";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  const hasQuery = Boolean(q?.trim());
  return buildMetadata({
    title: hasQuery ? `Busca: ${q?.trim()}` : "Busca no blog",
    description: "Encontre artigos sobre bordado, máquinas e técnicas.",
    path: hasQuery ? `/blog/busca?q=${encodeURIComponent(q!.trim())}` : "/blog/busca",
    noIndex: hasQuery,
  });
}

export default async function BlogSearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const categories = await getPublicBlogCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Página inicial", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: "Busca", path: "/blog/busca" },
        ])}
      />
      <BlogBreadcrumb
        items={[
          { label: "Página inicial", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Busca" },
        ]}
      />

      <header className="mt-6 text-center sm:text-left">
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-brown)]">
          Buscar no blog
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Encontre dicas, tutoriais e novidades do ateliê.
        </p>
      </header>

      <div className="mt-8">
        <BlogSearchClient initialQuery={q ?? ""} categories={categories} />
      </div>
    </div>
  );
}
