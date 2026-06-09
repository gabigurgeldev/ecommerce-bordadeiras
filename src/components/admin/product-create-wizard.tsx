"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category, ProductWithRelations } from "@/lib/types/database";

/** @deprecated Use /admin/produtos/novo and ProductFormPage instead */
export function ProductCreateWizard({
  product,
  trigger,
  categories: _categories,
  defaultOpen: _defaultOpen,
  onClose: _onClose,
}: {
  categories: Category[];
  product?: ProductWithRelations;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const href = product ? `/admin/produtos/${product.id}` : "/admin/produtos/novo";

  if (trigger) {
    return (
      <Link href={href} className="inline-flex">
        {trigger}
      </Link>
    );
  }

  if (product) {
    return (
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={href}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Editar
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link href={href}>
        <Plus className="mr-2 h-4 w-4" />
        Novo produto
      </Link>
    </Button>
  );
}
