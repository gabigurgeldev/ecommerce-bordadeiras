"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import type { StorefrontTrustItem } from "@/lib/types/database";
import {
  reorderTrustBarItems,
  toggleTrustBarItemActive,
} from "@/actions/admin/trust-bar";
import { TrustBarFormDialog } from "@/components/admin/trust-bar-form-dialog";
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
import {
  TRUST_ICON_LABELS,
  getTrustIcon,
  isTrustIconKey,
} from "@/lib/trust-icons";
import { ArrowDown, ArrowUp, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function TrustIconCell({ icon }: { icon: string }) {
  const Icon = getTrustIcon(icon);
  const label = isTrustIconKey(icon) ? TRUST_ICON_LABELS[icon] : "Ícone";

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
        <Icon className="h-5 w-5 text-primary" weight="regular" aria-hidden />
      </span>
      <span className="hidden text-xs text-muted-foreground lg:block">{label}</span>
    </div>
  );
}

function TrustItemCard({
  item,
  index,
  total,
  onMove,
  onToggle,
}: {
  item: StorefrontTrustItem;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
}) {
  const Icon = getTrustIcon(item.icon);
  const iconLabel = isTrustIconKey(item.icon) ? TRUST_ICON_LABELS[item.icon] : "Ícone";

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
          <Icon className="h-6 w-6 text-primary" weight="regular" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-tight">{item.title}</h3>
            <Badge variant={item.active ? "default" : "secondary"} className="text-[10px]">
              {item.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{iconLabel}</span>
            <span>Ordem {item.sortOrder}</span>
            {item.link ? (
              <span className="inline-flex items-center gap-1 truncate">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.link}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-1 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label="Subir"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          aria-label="Descer"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onToggle}>
          {item.active ? "Desativar" : "Ativar"}
        </Button>
        <TrustBarFormDialog item={item} />
      </div>
    </article>
  );
}

export function TrustBarTable({ items }: { items: StorefrontTrustItem[] }) {
  const router = useRouter();

  const sorted = [...items].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const next = [...sorted];
    const a = next[index];
    const b = next[target];
    const aOrder = a.sortOrder;
    const bOrder = b.sortOrder;

    const res = await reorderTrustBarItems([
      { id: a.id, sortOrder: bOrder },
      { id: b.id, sortOrder: aOrder },
    ]);

    if (res.success) {
      toast.success("Ordem atualizada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const toggleActive = async (item: StorefrontTrustItem) => {
    const res = await toggleTrustBarItemActive(item.id, !item.active);
    if (res.success) {
      toast.success(item.active ? "Item desativado" : "Item ativado");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  if (sorted.length === 0) {
    return (
      <AdminEmptyState
        icon={ShieldCheck}
        title="Nenhum item cadastrado"
        description="Crie itens para a barra de confiança ou use o seed do banco."
        action={<TrustBarFormDialog />}
      />
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {sorted.map((item, index) => (
          <TrustItemCard
            key={item.id}
            item={item}
            index={index}
            total={sorted.length}
            onMove={(dir) => move(index, dir)}
            onToggle={() => toggleActive(item)}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ícone</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden lg:table-cell">Descrição</TableHead>
                <TableHead className="w-[72px]">Ordem</TableHead>
                <TableHead className="w-[88px]">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item, index) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <TrustIconCell icon={item.icon} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground lg:hidden">
                        {item.description}
                      </p>
                      {item.link ? (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.link}</span>
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[280px] lg:table-cell">
                    <p className="line-clamp-2 text-muted-foreground">{item.description}</p>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums text-muted-foreground">{item.sortOrder}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.active ? "default" : "secondary"}
                      className={cn(!item.active && "opacity-80")}
                    >
                      {item.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                        disabled={index === sorted.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Descer"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(item)}
                      >
                        {item.active ? "Desativar" : "Ativar"}
                      </Button>
                      <TrustBarFormDialog item={item} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
