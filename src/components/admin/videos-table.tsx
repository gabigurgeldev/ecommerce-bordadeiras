"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { VideoFormDialog } from "@/components/admin/video-form-dialog";
import type { StorefrontVideo } from "@/lib/types/database";
import { parseProductVideo } from "@/lib/product-video";
import {
  deleteVideo,
  reorderVideos,
  toggleVideoActive,
} from "@/actions/admin/videos";
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
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2, Video } from "lucide-react";

function sortVideos(videos: StorefrontVideo[]) {
  return [...videos].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function VideoPreview({ video, className }: { video: StorefrontVideo; className?: string }) {
  const meta = parseProductVideo(video.url);
  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-md border bg-muted/30 ${className ?? ""}`}
    >
      {meta?.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meta.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <Video className="h-6 w-6 opacity-50" />
          <span className="text-[10px] uppercase tracking-wide">
            {meta?.type ?? "embed"}
          </span>
        </div>
      )}
      <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-sm">
        #{video.sortOrder}
      </span>
    </div>
  );
}

function VideoActions({
  video,
  index,
  total,
  onMove,
  onEdit,
  onDelete,
}: {
  video: StorefrontVideo;
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
          const res = await toggleVideoActive(video.id, !video.active);
          if (res.success) {
            toast.success(video.active ? "Vídeo desativado" : "Vídeo ativado");
            router.refresh();
          } else toast.error(res.error);
        }}
      >
        {video.active ? "Desativar" : "Ativar"}
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
        aria-label="Excluir vídeo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function VideosTable({ videos }: { videos: StorefrontVideo[] }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<StorefrontVideo | null>(null);

  const sorted = useMemo(() => sortVideos(videos), [videos]);
  const activeCount = useMemo(() => videos.filter((v) => v.active).length, [videos]);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[target];

    const res = await reorderVideos([
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
        icon={Video}
        title="Nenhum vídeo cadastrado"
        description="Adicione links do YouTube, Vimeo ou embeds para a página /videos."
        action={<VideoFormDialog />}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {sorted.length} {sorted.length === 1 ? "vídeo" : "vídeos"} · {activeCount} ativo
          {activeCount === 1 ? "" : "s"} na página
        </span>
        <span className="hidden sm:inline">Ordenados por posição na galeria</span>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((video, index) => (
          <article
            key={video.id}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <VideoPreview video={video} className="w-full rounded-none border-0" />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{video.title}</h3>
                  <Link
                    href={video.url}
                    className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    {video.url}
                  </Link>
                </div>
                <Badge variant={video.active ? "default" : "secondary"}>
                  {video.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <VideoActions
                video={video}
                index={index}
                total={sorted.length}
                onMove={move}
                onEdit={() => setEditingVideo(video)}
                onDelete={() => setDeleteId(video.id)}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Prévia</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden lg:table-cell">URL</TableHead>
              <TableHead className="w-[80px]">Ordem</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((video, index) => (
              <TableRow key={video.id}>
                <TableCell className="py-3">
                  <VideoPreview video={video} className="w-[180px]" />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{video.title}</div>
                  {video.description ? (
                    <p className="mt-0.5 line-clamp-1 max-w-[240px] text-xs text-muted-foreground">
                      {video.description}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="hidden max-w-[220px] lg:table-cell">
                  <Link
                    href={video.url}
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    {video.url}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{video.sortOrder}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={video.active ? "default" : "secondary"} className="w-fit">
                    {video.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <VideoActions
                      video={video}
                      index={index}
                      total={sorted.length}
                      onMove={move}
                      onEdit={() => setEditingVideo(video)}
                      onDelete={() => setDeleteId(video.id)}
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
        title="Excluir vídeo?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const res = await deleteVideo(deleteId);
          if (res.success) {
            toast.success("Vídeo excluído");
            setDeleteId(null);
            router.refresh();
          } else toast.error(res.error);
        }}
      />

      {editingVideo ? (
        <VideoFormDialog
          key={editingVideo.id}
          video={editingVideo}
          defaultOpen
          onClose={() => setEditingVideo(null)}
        />
      ) : null}
    </div>
  );
}
