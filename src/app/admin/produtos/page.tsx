import Link from "next/link";
import { listProducts, exportProductsCsv } from "@/actions/admin/products";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { CsvExportButton } from "@/components/admin/csv-stub-buttons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo da loja"
        actions={
          <>
            <CsvExportButton onExport={exportProductsCsv} />
            <Button asChild>
              <Link href="/admin/produtos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo produto
              </Link>
            </Button>
          </>
        }
      />
      <ProductsTable products={products} />
    </div>
  );
}
