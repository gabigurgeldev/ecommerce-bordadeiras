"use client";

import { useMemo, useState } from "react";
import { Calendar, Percent, Plus, Ticket, Wallet } from "lucide-react";
import { CouponFormDialog } from "@/components/admin/coupon-form-dialog";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CouponType, type Coupon } from "@/lib/types/database";
import { cn, formatCurrency } from "@/lib/utils";

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minCents: number | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  usedCount: number;
  maxUses: number | null;
};

type CouponStatus = "active" | "inactive" | "expired" | "exhausted" | "scheduled";

const statusConfig: Record<
  CouponStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
  expired: { label: "Expirado", variant: "destructive" },
  exhausted: { label: "Esgotado", variant: "outline" },
  scheduled: { label: "Agendado", variant: "outline" },
};

function getCouponStatus(coupon: CouponRow): CouponStatus {
  if (!coupon.active) return "inactive";
  const now = new Date();
  if (coupon.validUntil && new Date(coupon.validUntil) < now) return "expired";
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return "scheduled";
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return "exhausted";
  return "active";
}

function formatCouponValue(type: string, value: number) {
  return type === CouponType.PERCENT ? `${value}%` : formatCurrency(value);
}

function formatValidity(validFrom: string | null, validUntil: string | null) {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
  if (validFrom && validUntil) return `${fmt(validFrom)} – ${fmt(validUntil)}`;
  if (validFrom) return `A partir de ${fmt(validFrom)}`;
  if (validUntil) return `Até ${fmt(validUntil)}`;
  return "Sem prazo";
}

function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const cfg = statusConfig[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function toCoupon(coupon: CouponRow): Coupon {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type as CouponType,
    value: coupon.value,
    minCents: coupon.minCents,
    validFrom: coupon.validFrom ? new Date(coupon.validFrom) : null,
    validUntil: coupon.validUntil ? new Date(coupon.validUntil) : null,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    active: coupon.active,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function CouponCard({ coupon }: { coupon: CouponRow }) {
  const status = getCouponStatus(coupon);
  const isPercent = coupon.type === CouponType.PERCENT;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-base font-semibold tracking-wide">{coupon.code}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isPercent ? "Desconto percentual" : "Desconto fixo"}
          </p>
        </div>
        <CouponStatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="font-medium tabular-nums">{formatCouponValue(coupon.type, coupon.value)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Usos</p>
          <p className="font-medium tabular-nums">
            {coupon.usedCount}
            {coupon.maxUses != null ? ` / ${coupon.maxUses}` : " / ∞"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Validade</p>
          <p className="font-medium">{formatValidity(coupon.validFrom, coupon.validUntil)}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <CouponFormDialog coupon={toCoupon(coupon)} />
      </div>
    </div>
  );
}

export function CouponsList({ coupons }: { coupons: CouponRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      const status = getCouponStatus(c);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q);
    });
  }, [coupons, search, statusFilter]);

  if (coupons.length === 0) {
    return (
      <AdminEmptyState
        icon={Ticket}
        title="Nenhum cupom cadastrado"
        description="Crie cupons de desconto para campanhas promocionais."
        action={<CouponFormDialog />}
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código…"
        count={filtered.length}
        countLabel="cupons"
        filters={
          <select
            className={adminFilterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="scheduled">Agendados</option>
            <option value="inactive">Inativos</option>
            <option value="expired">Expirados</option>
            <option value="exhausted">Esgotados</option>
          </select>
        }
      />

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Nenhum cupom encontrado com os filtros atuais.
          </p>
        ) : (
          filtered.map((c) => <CouponCard key={c.id} coupon={c} />)
        )}
      </div>

      <div className="hidden rounded-lg border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead className="hidden lg:table-cell">Validade</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum cupom encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const status = getCouponStatus(c);
                  const isPercent = c.type === CouponType.PERCENT;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell>
                        <span className="font-mono font-semibold tracking-wide">{c.code}</span>
                        {c.minCents != null && c.minCents > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Mín. {formatCurrency(c.minCents)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {isPercent ? (
                            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {isPercent ? "Percentual" : "Fixo"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {formatCouponValue(c.type, c.value)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatValidity(c.validFrom, c.validUntil)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "tabular-nums",
                            c.maxUses != null && c.usedCount >= c.maxUses && "text-muted-foreground",
                          )}
                        >
                          {c.usedCount}
                          {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CouponStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <CouponFormDialog coupon={toCoupon(c)} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export function CouponsListHeaderAction() {
  return (
    <CouponFormDialog
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo cupom
        </Button>
      }
    />
  );
}
