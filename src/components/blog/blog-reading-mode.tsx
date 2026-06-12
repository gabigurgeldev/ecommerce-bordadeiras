"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Minimize2 } from "lucide-react";
import { useState } from "react";

const comfortProseClass =
  "mx-auto max-w-[42rem] text-lg leading-[1.85] [&_h2]:text-[1.625rem] [&_h3]:text-[1.375rem] [&_li]:text-lg [&_p]:text-lg [&_p]:leading-[1.85]";

export function BlogArticleContent({
  html,
  proseClass,
}: {
  html: string;
  proseClass: string;
}) {
  const [comfort, setComfort] = useState(false);

  return (
    <div className="mt-8 lg:mt-10">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 px-3 py-2.5 sm:px-4"
        role="toolbar"
        aria-label="Opções de leitura"
      >
        <button
          type="button"
          onClick={() => setComfort((v) => !v)}
          aria-pressed={comfort}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2",
            comfort
              ? "bg-[var(--color-brown)] text-white shadow-sm"
              : "bg-white text-[var(--color-brown)] shadow-sm hover:bg-white/80",
          )}
        >
          {comfort ? (
            <>
              <Minimize2 className="h-4 w-4" aria-hidden />
              Modo padrão
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" aria-hidden />
              Modo leitura confortável
            </>
          )}
        </button>
        <span className="text-xs text-[var(--muted-foreground)]">
          {comfort ? "Texto maior e coluna estreita" : "Ative para ler com mais conforto"}
        </span>
      </div>

      <div
        id="blog-article-content"
        className={cn(
          "mt-8 transition-all duration-300",
          proseClass,
          comfort && comfortProseClass,
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
