"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProduct, duplicateProduct } from "@/actions/admin/products";
import { formatCurrency } from "@/lib/utils";
import type { Category, Product } from "@prisma/client";

type Row = Product & { category: Category | null };

export function ProductsTable({ products }: { products: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "sku", header: "SKU", cell: ({ row }) => row.original.sku ?? "—" },
    {
      accessorKey: "priceCents",
      header: "Preço",
      cell: ({ row }) => formatCurrency(row.original.priceCents),
    },
    { accessorKey: "stock", header: "Estoque" },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/produtos/${row.original.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const res = await duplicateProduct(row.original.id);
              if (res.success) toast.success("Produto duplicado");
              else toast.error(res.error);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (!confirm("Excluir produto?")) return;
              const res = await deleteProduct(row.original.id);
              if (res.success) toast.success("Produto excluído");
              else toast.error(res.error);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={products} />;
}
