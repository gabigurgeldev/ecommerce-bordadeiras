import { listCategories } from "@/actions/admin/categories";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <PageHeader title="Categorias" description="Organize o catálogo" actions={<CategoryFormDialog categories={categories} />} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>{cat.slug}</TableCell>
                <TableCell>{cat.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={cat.active ? "default" : "secondary"}>
                    {cat.active ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <CategoryFormDialog category={cat} categories={categories} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
