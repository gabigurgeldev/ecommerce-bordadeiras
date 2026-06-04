"use client";

import Image from "next/image";
import { toast } from "sonner";
import type { StorefrontBanner } from "@/lib/types/database";
import {
  deleteBanner,
  reorderBanners,
  toggleBannerActive,
} from "@/actions/admin/banners";
import { BannerFormDialog } from "@/components/admin/banner-form-dialog";
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
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

export function BannersTable({ banners }: { banners: StorefrontBanner[] }) {
  const sorted = [...banners].sort(
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

    const res = await reorderBanners([
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
            <TableHead className="w-[120px]">Prévia</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum banner cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((banner, index) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <div className="relative aspect-[21/9] w-28 overflow-hidden rounded border">
                    <Image
                      src={banner.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={banner.imageUrl.startsWith("http://localhost")}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell>{banner.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={banner.active ? "default" : "secondary"}>
                    {banner.active ? "Ativo" : "Inativo"}
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
                        const res = await toggleBannerActive(
                          banner.id,
                          !banner.active,
                        );
                        if (res.success) {
                          toast.success(
                            banner.active ? "Banner desativado" : "Banner ativado",
                          );
                          window.location.reload();
                        } else toast.error(res.error);
                      }}
                    >
                      {banner.active ? "Desativar" : "Ativar"}
                    </Button>
                    <BannerFormDialog banner={banner} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={async () => {
                        if (!confirm("Excluir este banner?")) return;
                        const res = await deleteBanner(banner.id);
                        if (res.success) {
                          toast.success("Banner excluído");
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
