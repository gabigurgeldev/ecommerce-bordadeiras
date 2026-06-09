"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Package, Plus } from "lucide-react";
import { ProductsTable } from "@/components/admin/products-table";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Button } from "@/components/ui/button";
import type { Category, ProductWithRelations } from "@/lib/types/database";

export function ProductsList({
  products,
  categories,
}: {
  products: ProductWithRelations[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.category?.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, search, statusFilter]);

  if (products.length === 0) {
    return (
      <AdminEmptyState
        icon={Package}
        title="Nenhum produto cadastrado"
        description="Adicione seu primeiro produto ao catálogo da loja."
        action={
          <Button asChild>
            <Link href="/admin/produtos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo produto
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, SKU ou categoria…"
        count={filtered.length}
        countLabel="produtos"
        filters={
          <select
            className={adminFilterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="DRAFT">Rascunho</option>
            <option value="OUT_OF_STOCK">Sem estoque</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        }
      />
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description="Ajuste a busca ou os filtros para ver outros resultados."
          className="py-8"
        />
      ) : (
        <ProductsTable products={filtered} />
      )}
    </>
  );
}
