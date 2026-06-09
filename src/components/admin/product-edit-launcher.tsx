"use client";

import { useRouter } from "next/navigation";
import { ProductCreateWizard } from "@/components/admin/product-create-wizard";
import type { Category, ProductWithRelations } from "@/lib/types/database";

export function ProductEditLauncher({
  product,
  categories,
}: {
  product: ProductWithRelations;
  categories: Category[];
}) {
  const router = useRouter();

  return (
    <ProductCreateWizard
      product={product}
      categories={categories}
      defaultOpen
      onClose={() => router.push("/admin/produtos")}
    />
  );
}
