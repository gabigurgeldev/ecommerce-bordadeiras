import Link from "next/link";
import { listCoupons } from "@/actions/admin/coupons";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  return (
    <div>
      <PageHeader
        title="Cupons"
        actions={
          <Button asChild>
            <Link href="/admin/cupons/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo cupom
            </Link>
          </Button>
        }
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">{c.code}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.value}</TableCell>
                <TableCell>
                  {c.usedCount}
                  {c.maxUses ? ` / ${c.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={c.active ? "default" : "secondary"}>
                    {c.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/cupons/${c.id}`} className="text-sm text-primary hover:underline">
                    Editar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
