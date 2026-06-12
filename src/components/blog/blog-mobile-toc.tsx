import type { TocHeading } from "@/lib/blog/public-utils";
import { ListTree } from "lucide-react";

export function BlogMobileToc({ toc }: { toc: TocHeading[] }) {
  if (!toc.length) return null;

  return (
    <details className="group mt-6 rounded-2xl border border-[var(--color-card-border)] bg-white shadow-sm lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-[var(--color-brown)] [&::-webkit-details-marker]:hidden">
        <ListTree className="h-4 w-4 text-[var(--color-green)]" aria-hidden />
        Sumário do artigo
        <span className="ml-auto text-xs font-normal text-[var(--muted-foreground)]">
          {toc.length} {toc.length === 1 ? "seção" : "seções"}
        </span>
      </summary>
      <nav aria-label="Sumário" className="border-t border-[var(--color-card-border)] px-4 py-3">
        <ul className="space-y-2 text-sm">
          {toc.map((heading) => (
            <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}>
              <a
                href={`#${heading.id}`}
                className="block rounded-lg px-2 py-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--color-cta)]"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
