"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ShoppingBag, Users } from "lucide-react";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";

type CustomerRow = {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  createdAt: string | Date;
};

function getCustomerInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "?";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function CustomerAvatar({
  name,
  email,
  size = "md",
}: {
  name: string | null;
  email: string;
  size?: "sm" | "md";
}) {
  const initials = getCustomerInitials(name, email);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs",
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function OrderCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Sem pedidos
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <ShoppingBag className="h-3 w-3" />
      {count} {count === 1 ? "pedido" : "pedidos"}
    </Badge>
  );
}

export function CustomersList({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false),
    );
  }, [customers, search]);

  if (customers.length === 0) {
    return (
      <AdminEmptyState
        icon={Users}
        title="Nenhum cliente cadastrado"
        description="Clientes aparecem após o primeiro cadastro na loja."
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar nome ou e-mail…"
        count={filtered.length}
        countLabel="clientes"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="Nenhum cliente encontrado"
          description="Tente buscar por outro nome ou e-mail."
          className="py-10"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[280px]">Cliente</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <CustomerAvatar name={c.name} email={c.email} />
                        <span className="font-medium truncate">{c.name ?? "—"}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[220px]">
                      {c.email}
                    </TableCell>
                    <TableCell>
                      <OrderCountBadge count={c.orderCount} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="inline-flex text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-label={`Ver cliente ${c.name ?? c.email}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-3">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors",
                    "hover:bg-muted/30 active:bg-muted/50",
                  )}
                >
                  <CustomerAvatar name={c.name} email={c.email} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium truncate">{c.name ?? "Sem nome"}</p>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OrderCountBadge count={c.orderCount} />
                      <span className="text-xs text-muted-foreground">
                        Desde {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
