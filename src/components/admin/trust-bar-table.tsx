"use client";

import { toast } from "sonner";
import type { StorefrontTrustItem } from "@/lib/types/database";
import {
  deleteTrustBarItem,
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
import { getTrustIcon } from "@/lib/trust-icons";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

export function TrustBarTable({ items }: { items: StorefrontTrustItem[] }) {
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
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]">Ícone</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum item cadastrado. Use o seed ou crie um novo item.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((item, index) => {
              const Icon = getTrustIcon(item.icon);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {item.description}
                  </TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "default" : "secondary"}>
                      {item.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                        className="h-8 w-8"
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
                        onClick={async () => {
                          const res = await toggleTrustBarItemActive(
                            item.id,
                            !item.active,
                          );
                          if (res.success) {
                            toast.success(
                              item.active ? "Item desativado" : "Item ativado",
                            );
                            window.location.reload();
                          } else toast.error(res.error);
                        }}
                      >
                        {item.active ? "Desativar" : "Ativar"}
                      </Button>
                      <TrustBarFormDialog item={item} />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          if (!confirm("Excluir este item?")) return;
                          const res = await deleteTrustBarItem(item.id);
                          if (res.success) {
                            toast.success("Item excluído");
                            window.location.reload();
                          } else toast.error(res.error);
                        }}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
