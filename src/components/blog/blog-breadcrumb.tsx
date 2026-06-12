import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BlogBreadcrumbItem = {
  label: string;
  href?: string;
};

export function BlogBreadcrumb({ items }: { items: BlogBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition hover:text-[var(--color-cta)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "max-w-[min(100%,20rem)] truncate font-medium text-[var(--color-brown)] sm:max-w-none" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
