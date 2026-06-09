"use client";

import { StoreSearchForm } from "@/components/shop/store-search-form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/types/catalog";
import { useEffect, useState } from "react";

export function SearchCommandDialog({
  categories,
}: {
  categories: Pick<Category, "slug" | "name">[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogTitle>Buscar produtos</DialogTitle>
        <StoreSearchForm
          categories={categories}
          variant="panel"
          onNavigate={() => setOpen(false)}
        />
        <p className="text-xs text-[var(--muted-foreground)]">
          Atalho: Ctrl+K ou Cmd+K
        </p>
      </DialogContent>
    </Dialog>
  );
}
