import { listCategories } from "@/actions/admin/categories";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { CategoriesList } from "@/components/admin/categories-list";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const categories = await listCategories();

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize o catálogo"
        actions={<CategoryFormDialog categories={categories} />}
      />
      <CategoriesList categories={categories} editCategoryId={edit ?? null} />
    </div>
  );
}
