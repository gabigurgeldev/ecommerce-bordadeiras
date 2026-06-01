import { listCategories } from "@/actions/admin/categories";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <div>
      <PageHeader title="Novo produto" />
      <ProductForm categories={categories} />
    </div>
  );
}
