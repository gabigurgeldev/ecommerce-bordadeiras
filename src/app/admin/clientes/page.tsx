import Link from "next/link";
import { listCustomers } from "@/actions/admin/customers";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <PageHeader title="Clientes" description="Usuários cadastrados na loja" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name ?? "—"}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c._count.orders}</TableCell>
                <TableCell>{formatDate(c.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/clientes/${c.id}`} className="text-sm text-primary hover:underline">
                    Ver
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
