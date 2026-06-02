"use client";

import Link from "next/link";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductStatus } from "@prisma/client";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProduct, duplicateProduct } from "@/actions/admin/products";
import { formatCurrency } from "@/lib/utils";
import type { Category, Product, ProductImage } from "@prisma/client";

type Row = Product & {
  category: Category | null;
  productImages: ProductImage[];
};

const STATUS_VARIANT: Record<
  ProductStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
  OUT_OF_STOCK: "destructive",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
  OUT_OF_STOCK: "Sem estoque",
};

function productThumbnail(productImages: ProductImage[]): string | null {
  const primary = productImages.find((img) => img.isPrimary);
  const first = productImages[0];
  return primary?.url ?? first?.url ?? null;
}

export function ProductsTable({ products }: { products: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      id: "thumbnail",
      header: "",
      cell: ({ row }) => {
        const url = productThumbnail(row.original.productImages);
        return url ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-md border">
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
              unoptimized={url.startsWith("http://localhost")}
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            —
          </div>
        );
      },
    },
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "sku", header: "SKU", cell: ({ row }) => row.original.sku ?? "—" },
    {
      accessorKey: "priceCents",
      header: "Preço",
      cell: ({ row }) => formatCurrency(row.original.priceCents),
    },
    { accessorKey: "stock", header: "Estoque" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={STATUS_VARIANT[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
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
