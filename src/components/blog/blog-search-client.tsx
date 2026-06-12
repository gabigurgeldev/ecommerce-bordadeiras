"use client";

import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogEmptyState } from "@/components/blog/blog-widgets";
import {
  filterPostsByPeriod,
  highlightSearchTerms,
  type PublicBlogPost,
} from "@/lib/blog/public-utils";
import type { BlogCategory } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SearchResult = {
  posts: {
    items: PublicBlogPost[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type Props = {
  initialQuery: string;
  categories: BlogCategory[];
};

export function BlogSearchClient({ initialQuery, categories }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState<string>("all");
  const [period, setPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categorySlug, period]);

  const fetchResults = useCallback(async () => {
    if (debouncedQuery.length < 2) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: String(page),
        pageSize: "12",
        type: "posts",
      });
      const res = await fetch(`/api/blog/search?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro na busca");
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError("Não foi possível realizar a busca.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  let posts = result?.posts.items ?? [];
  if (categorySlug !== "all") {
    posts = posts.filter((p) => p.category?.slug === categorySlug);
  }
  posts = filterPostsByPeriod(posts, period);

  const total = categorySlug !== "all" || period !== "all"
    ? posts.length
    : (result?.posts.total ?? 0);

  return (
    <div>
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm">
        <Label htmlFor="blog-search-input" className="sr-only">
          Buscar no blog
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            id="blog-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite palavras-chave para buscar artigos…"
            className="h-12 pl-10 text-base"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[var(--color-cta)]" />
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="filter-category" className="text-xs text-[var(--muted-foreground)]">
              Categoria
            </Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger id="filter-category" className="mt-1">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-period" className="text-xs text-[var(--muted-foreground)]">
              Período
            </Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger id="filter-period" className="mt-1">
                <SelectValue placeholder="Qualquer data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer data</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {debouncedQuery.length >= 2 && (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          {loading ? "Buscando…" : `${total} resultado${total !== 1 ? "s" : ""} para "${debouncedQuery}"`}
        </p>
      )}

      {error && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {debouncedQuery.length < 2 ? (
        <p className="mt-10 text-center text-sm text-[var(--muted-foreground)]">
          Digite ao menos 2 caracteres para buscar.
        </p>
      ) : !loading && posts.length === 0 ? (
        <div className="mt-10">
          <BlogEmptyState
            title="Nenhum resultado"
            description={`Não encontramos artigos para "${debouncedQuery}". Tente outros termos.`}
            actionHref="/blog"
            actionLabel="Ver todos os artigos"
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                highlightQuery={highlightSearchTerms(post.title, debouncedQuery)}
              />
            ))}
          </div>
          {categorySlug === "all" && period === "all" && result && result.posts.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Página {page} de {result.posts.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= result.posts.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
