"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BlogSearchWidget({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(`/blog/busca?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">Buscar</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Palavra-chave…"
          className="h-10"
          minLength={2}
          aria-label="Buscar no blog"
        />
        <Button type="submit" size="icon" className="shrink-0" aria-label="Buscar">
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
