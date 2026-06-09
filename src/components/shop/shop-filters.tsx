"use client";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export function ShopFilters({
  categories = [],
}: {
  categories?: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebounce(q, 400);

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/loja?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedQ !== current) {
      update({ q: debouncedQ || null });
    }
  }, [debouncedQ, searchParams, update]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Buscar
          </label>
          <Input
            placeholder="Nome do produto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Categoria
          </label>
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            defaultValue={searchParams.get("category") ?? ""}
            onChange={(e) => update({ category: e.target.value || null })}
            disabled={pending}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Ordenar
          </label>
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            defaultValue={searchParams.get("sort") ?? "newest"}
            onChange={(e) => update({ sort: e.target.value })}
            disabled={pending}
          >
            <option value="newest">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A–Z</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Preço mín. (R$)
          </label>
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("minPrice") ?? ""}
            onChange={(e) => update({ minPrice: e.target.value || null })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Preço máx. (R$)
          </label>
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onChange={(e) => update({ maxPrice: e.target.value || null })}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("inStock") === "1"}
            onChange={(e) =>
              update({ inStock: e.target.checked ? "1" : null })
            }
          />
          Apenas em estoque
        </label>
      </div>
    </div>
  );
}
