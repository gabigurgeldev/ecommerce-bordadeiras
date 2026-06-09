import { listCategories } from "@/actions/admin/categories";
import { ProductFormPage } from "@/components/admin/product-form-page";

export default async function NewProductPage() {
  const categories = await listCategories();
  return <ProductFormPage categories={categories} />;
}
