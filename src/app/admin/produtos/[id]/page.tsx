import { notFound } from "next/navigation";
import { getProduct } from "@/actions/admin/products";
import { listCategories } from "@/actions/admin/categories";
import { ProductFormPage } from "@/components/admin/product-form-page";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), listCategories()]);

  if (!product) notFound();

  return <ProductFormPage product={product} categories={categories} />;
}
