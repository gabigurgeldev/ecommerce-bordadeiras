"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
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
import { ArrowDown, ArrowUp, ExternalLink, ImageIcon, Pencil, Trash2 } from "lucide-react";

function sortBanners(banners: StorefrontBanner[]) {
  return [...banners].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function BannerPreview({
  banner,
  className,
  sizes,
}: {
  banner: StorefrontBanner;
  className?: string;
  sizes: string;
}) {
  const imageUrl = banner.desktopImageUrl || banner.imageUrl;
  return (
    <div
      className={`relative aspect-[21/9] overflow-hidden rounded-md border bg-muted/30 ${className ?? ""}`}
    >
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        sizes={sizes}
        unoptimized={imageUrl.startsWith("http://localhost")}
      />
      <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-sm">
        #{banner.sortOrder}
      </span>
    </div>
  );
}

function BannerActions({
  banner,
  index,
  total,
  onMove,
  onEdit,
  onDelete,
}: {
  banner: StorefrontBanner;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
        aria-label="Subir ordem"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={index === total - 1}
        onClick={() => onMove(index, 1)}
        aria-label="Descer ordem"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          const res = await toggleBannerActive(banner.id, !banner.active);
          if (res.success) {
            toast.success(banner.active ? "Banner desativado" : "Banner ativado");
            router.refresh();
          } else toast.error(res.error);
        }}
      >
        {banner.active ? "Desativar" : "Ativar"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Editar
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8"
        onClick={onDelete}
        aria-label="Excluir banner"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function BannersTable({ banners }: { banners: StorefrontBanner[] }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<StorefrontBanner | null>(null);

  const sorted = useMemo(() => sortBanners(banners), [banners]);
  const activeCount = useMemo(() => banners.filter((b) => b.active).length, [banners]);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[target];

    const res = await reorderBanners([
      { id: a.id, sortOrder: b.sortOrder },
      { id: b.id, sortOrder: a.sortOrder },
    ]);

    if (res.success) {
      toast.success("Ordem atualizada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  if (sorted.length === 0) {
    return (
      <AdminEmptyState
        icon={ImageIcon}
        title="Nenhum banner cadastrado"
        description="Adicione slides para o carrossel da página inicial."
        action={<BannerFormDialog />}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {sorted.length} {sorted.length === 1 ? "banner" : "banners"} · {activeCount} ativo
          {activeCount === 1 ? "" : "s"} na vitrine
        </span>
        <span className="hidden sm:inline">Ordenados por posição no carrossel</span>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((banner, index) => (
          <article
            key={banner.id}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <BannerPreview banner={banner} className="w-full rounded-none border-0" sizes="100vw" />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{banner.title}</h3>
                  {banner.link ? (
                    <Link
                      href={banner.link}
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                      target={banner.link.startsWith("http") ? "_blank" : undefined}
                      rel={banner.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                      {banner.link}
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Sem link de destino</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={banner.active ? "default" : "secondary"}>
                    {banner.active ? "Ativo" : "Inativo"}
                  </Badge>
                  {(banner.startDate || banner.endDate) && (
                    <span className="text-[10px] text-muted-foreground leading-tight text-right">
                      {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : "Sempre"} -{" "}
                      {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : "Sempre"}
                    </span>
                  )}
                </div>
              </div>
              <BannerActions
                banner={banner}
                index={index}
                total={sorted.length}
                onMove={move}
                onEdit={() => setEditingBanner(banner)}
                onDelete={() => setDeleteId(banner.id)}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Prévia</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden lg:table-cell">Link</TableHead>
              <TableHead className="w-[80px]">Ordem</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((banner, index) => (
              <TableRow key={banner.id}>
                <TableCell className="py-3">
                  <BannerPreview banner={banner} className="w-[180px]" sizes="180px" />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{banner.title}</div>
                  {banner.link && (
                    <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground lg:hidden">
                      {banner.link}
                    </p>
                  )}
                </TableCell>
                <TableCell className="hidden max-w-[220px] lg:table-cell">
                  {banner.link ? (
                    <Link
                      href={banner.link}
                      className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                      target={banner.link.startsWith("http") ? "_blank" : undefined}
                      rel={banner.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                      {banner.link}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{banner.sortOrder}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={banner.active ? "default" : "secondary"} className="w-fit">
                      {banner.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {(banner.startDate || banner.endDate) && (
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : "Sempre"} -{" "}
                        {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : "Sempre"}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <BannerActions
                      banner={banner}
                      index={index}
                      total={sorted.length}
                      onMove={move}
                      onEdit={() => setEditingBanner(banner)}
                      onDelete={() => setDeleteId(banner.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir banner?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const res = await deleteBanner(deleteId);
          if (res.success) {
            toast.success("Banner excluído");
            setDeleteId(null);
            router.refresh();
          } else toast.error(res.error);
        }}
      />

      {editingBanner ? (
        <BannerFormDialog
          key={editingBanner.id}
          banner={editingBanner}
          defaultOpen
          onClose={() => setEditingBanner(null)}
        />
      ) : null}
    </div>
  );
}
