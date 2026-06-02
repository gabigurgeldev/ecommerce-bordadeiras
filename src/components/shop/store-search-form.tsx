"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type StoreSearchFormProps = {
  categories: Pick<Category, "slug" | "name">[];
  className?: string;
  /** Painel branco do hero */
  variant?: "header" | "panel";
};

export function StoreSearchForm({
  categories,
  className,
  variant = "header",
}: StoreSearchFormProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    if (category) params.set("category", category);
    const query = params.toString();
    router.push(query ? `/loja?${query}` : "/loja");
  }

  const selectClass =
    variant === "panel"
      ? "h-11 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-3 text-sm text-[var(--color-brown)]"
      : "h-11 min-w-[8.5rem] shrink-0 rounded-l-xl border border-r-0 border-[var(--color-card-border)] bg-[var(--secondary)] px-3 text-sm text-[var(--color-brown)] sm:min-w-[10rem]";

  const inputClass =
    variant === "panel"
      ? "h-11 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-4 text-sm"
      : "h-11 min-w-0 flex-1 rounded-none border border-[var(--color-card-border)] bg-white px-4 text-sm";

  if (variant === "panel") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-3", className)}
        role="search"
      >
        <p className="font-display text-lg font-semibold text-[var(--color-brown)]">
          Encontre na loja
        </p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="O que você procura?"
          className={inputClass}
          aria-label="Buscar produtos"
        />
        <Button type="submit" className="w-full" size="lg">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full max-w-2xl flex-1 items-stretch", className)}
      role="search"
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={cn(selectClass, "hidden sm:block")}
        aria-label="Categoria"
      >
        <option value="">Todas</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar máquinas, linhas, acessórios…"
        className={inputClass}
        aria-label="Buscar produtos"
      />
      <Button
        type="submit"
        className="h-11 shrink-0 rounded-l-none rounded-r-xl px-5"
      >
        <Search className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Buscar</span>
      </Button>
    </form>
  );
}
