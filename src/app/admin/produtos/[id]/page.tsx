import { notFound } from "next/navigation";
import { getProduct } from "@/actions/admin/products";
import { listCategories } from "@/actions/admin/categories";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), listCategories()]);

  if (!product) notFound();

  return (
    <div>
      <PageHeader title="Editar produto" description={product.name} />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
