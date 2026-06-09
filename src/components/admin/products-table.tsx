"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, duplicateProduct } from "@/actions/admin/products";
import { formatCurrency } from "@/lib/utils";
import type { Category, Product, ProductImage } from "@/lib/types/database";

type Row = Product & {
  category: Category | null;
  productImages: ProductImage[];
};

function productThumbnail(productImages: ProductImage[] | undefined): string | null {
  const images = productImages ?? [];
  const primary = images.find((img) => img.isPrimary);
  const first = images[0];
  return primary?.url ?? first?.url ?? null;
}

function ProductThumbnail({ images }: { images: ProductImage[] }) {
  const url = productThumbnail(images);
  if (url) {
    return (
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
          unoptimized={url.startsWith("http://localhost")}
        />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
      —
    </div>
  );
}

function ProductRowActions({
  product,
  onDelete,
}: {
  product: Row;
  onDelete: () => void;
}) {
  const router = useRouter();

  const handleDuplicate = async () => {
    const res = await duplicateProduct(product.id);
    if (res.success) {
      toast.success("Produto duplicado");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/produtos/${product.id}`} aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function ProductsTable({
  products,
}: {
  products: Row[];
  categories?: Category[];
}) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <ProductThumbnail images={product.productImages} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="text-left font-medium leading-tight hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.sku ? (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    ) : null}
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{formatCurrency(product.priceCents)}</span>
                  <span className="text-muted-foreground">Estoque: {product.stock}</span>
                  {product.category ? (
                    <span className="text-muted-foreground">{product.category.name}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end border-t pt-3">
              <ProductRowActions product={product} onDelete={() => setDeleteId(product.id)} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden rounded-lg border bg-card shadow-sm md:block overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              <TableHead>Nome</TableHead>
              <TableHead className="hidden lg:table-cell">SKU</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="hidden sm:table-cell">Estoque</TableHead>
              <TableHead className="hidden lg:table-cell">Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/50">
                <TableCell>
                  <ProductThumbnail images={product.productImages} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-sm text-muted-foreground">
                  {product.sku ?? "—"}
                </TableCell>
                <TableCell>{formatCurrency(product.priceCents)}</TableCell>
                <TableCell className="hidden sm:table-cell">{product.stock}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {product.category?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell>
                  <ProductRowActions
                    product={product}
                    onDelete={() => setDeleteId(product.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir produto?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const res = await deleteProduct(deleteId);
          if (res.success) {
            toast.success("Produto excluído");
            setDeleteId(null);
            router.refresh();
          } else toast.error(res.error);
        }}
      />
    </>
  );
}
