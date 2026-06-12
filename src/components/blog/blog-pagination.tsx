import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function BlogPagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (totalPages <= 7) return true;
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-center gap-1 pt-8"
    >
      {page > 1 ? (
        <Link
          href={buildHref(basePath, page - 1, searchParams)}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-[var(--muted-foreground)] opacity-50">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </span>
      )}

      <div className="flex items-center gap-1 px-2">
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showEllipsis = prev != null && p - prev > 1;
          return (
            <span key={p} className="inline-flex items-center gap-1">
              {showEllipsis && (
                <span className="px-2 text-[var(--muted-foreground)]">…</span>
              )}
              <Link
                href={buildHref(basePath, p, searchParams)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition",
                  p === page
                    ? "bg-[var(--color-brown)] text-white"
                    : "text-[var(--color-brown)] hover:bg-[var(--secondary)]",
                )}
              >
                {p}
              </Link>
            </span>
          );
        })}
      </div>

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, page + 1, searchParams)}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-[var(--muted-foreground)] opacity-50">
          Próxima
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
