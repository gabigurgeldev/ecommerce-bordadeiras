"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Video } from "lucide-react";
import type { StorefrontVideo } from "@/lib/types/database";
import type { z } from "zod";
import { upsertVideo } from "@/actions/admin/videos";
import { videoSchema } from "@/lib/validations/admin";
import { parseProductVideo } from "@/lib/product-video";
import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.infer<typeof videoSchema>;

function videoToFormValues(video?: StorefrontVideo): FormValues {
  return {
    title: video?.title ?? "",
    description: video?.description ?? "",
    url: video?.url ?? "",
    sortOrder: video?.sortOrder ?? 0,
    active: video?.active ?? true,
  };
}

export function VideoFormDialog({
  video,
  trigger,
  defaultOpen = false,
  onClose,
}: {
  video?: StorefrontVideo;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(video);

  const form = useForm<FormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: videoToFormValues(video),
  });

  const resetForm = () => {
    form.reset(videoToFormValues(video));
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, video]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onClose?.();
  };

  const values = form.watch();
  const parsedVideo = values.url ? parseProductVideo(values.url) : null;

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const res = await upsertVideo(data, video?.id);
      if (res.success) {
        toast.success(isEdit ? "Vídeo atualizado" : "Vídeo criado");
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : !defaultOpen ? (
        isEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo vídeo
          </Button>
        )
      ) : null}

      <AdminFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "Editar vídeo" : "Novo vídeo"}
        description="YouTube, Vimeo ou URL de embed https://"
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void onSubmit()}>
              {submitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar vídeo"}
            </Button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <Label htmlFor="video-title" className="after:ml-0.5 after:text-destructive after:content-['*']">
              Título
            </Label>
            <Input
              id="video-title"
              {...form.register("title")}
              placeholder="Ex.: Bastidores do ateliê"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="video-description">Descrição (opcional)</Label>
            <Textarea
              id="video-description"
              rows={3}
              {...form.register("description")}
              placeholder="Breve texto exibido abaixo do vídeo"
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="video-url" className="after:ml-0.5 after:text-destructive after:content-['*']">
              URL do vídeo
            </Label>
            <Input
              id="video-url"
              {...form.register("url")}
              placeholder="https://www.youtube.com/watch?v=… ou embed"
            />
            <p className="text-xs text-muted-foreground">
              Aceita YouTube, Vimeo ou link de embed https:// de outros players.
            </p>
            {form.formState.errors.url && (
              <p className="text-xs text-destructive">{form.formState.errors.url.message}</p>
            )}
          </div>

          {(parsedVideo?.thumbnailUrl || values.url) && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Prévia</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted/30">
                {parsedVideo?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={parsedVideo.thumbnailUrl}
                    alt={values.title || "Prévia do vídeo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
                    <Video className="h-8 w-8 opacity-50" />
                    <span>
                      {parsedVideo
                        ? `Player ${parsedVideo.type} detectado`
                        : "Embed genérico — a prévia aparecerá na página pública"}
                    </span>
                    {values.url ? (
                      <a
                        href={values.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir URL
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="video-sort">Ordem na página</Label>
              <Input
                id="video-sort"
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Menor número aparece primeiro.</p>
            </div>
            <label className="mt-4 flex cursor-pointer flex-col justify-center gap-2 rounded-lg border px-4 py-2 sm:mt-0">
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...form.register("active")}
                />
                Ativo na página /videos
              </span>
              <span className="text-xs leading-tight text-muted-foreground">
                Desmarque para ocultar temporariamente.
              </span>
            </label>
          </div>
        </form>
      </AdminFormDialog>
    </>
  );
}
