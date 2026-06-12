import { adminListBlogCategories } from "@/actions/admin/blog-ext";
import { BlogCategoriesList } from "@/components/admin/blog/blog-categories-list";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import type { BlogCategory } from "@/lib/types/database";

export default async function AdminBlogCategoriesPage() {
  const result = await adminListBlogCategories({ page: 1, pageSize: 100, sortBy: "sortOrder", sortOrder: "asc" });
  const categories = ((result as { items?: BlogCategory[] }).items ?? []) as BlogCategory[];

  return (
    <AdminPageContainer>
      <PageHeader title="Categorias do blog" description="Organize posts por temas" />
      <BlogCategoriesList categories={categories} />
    </AdminPageContainer>
  );
}
