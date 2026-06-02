"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";
import type { StorefrontBanner } from "@prisma/client";
import type { z } from "zod";
import { upsertBanner } from "@/actions/admin/banners";
import { bannerSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageViaApi } from "@/lib/upload-via-api";

type FormValues = z.infer<typeof bannerSchema>;

export function BannerFormDialog({ banner }: { banner?: StorefrontBanner }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const draftId = useMemo(
    () => banner?.id ?? crypto.randomUUID(),
    [banner?.id],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title ?? "",
      imageUrl: banner?.imageUrl ?? "",
      link: banner?.link ?? "",
      sortOrder: banner?.sortOrder ?? 0,
      active: banner?.active ?? true,
    },
  });

  const imageUrl = form.watch("imageUrl");

  if (!open && !banner) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Novo banner
      </Button>
    );
  }

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertBanner(data, banner?.id);
    if (res.success) {
      toast.success(banner ? "Banner atualizado" : "Banner criado");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  });

  return (
    <div className={banner ? "inline-block" : "rounded-lg border p-4"}>
      {banner ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      ) : null}

      {open && (
        <form
          onSubmit={onSubmit}
          className={
            banner
              ? "mt-4 space-y-3 rounded-lg border p-4"
              : "space-y-3"
          }
        >
          <div className="space-y-1">
            <Label>Título interno (admin)</Label>
            <Input {...form.register("title")} placeholder="Ex.: Promo verão" />
          </div>

          <div className="space-y-1">
            <Label>URL da imagem</Label>
            <Input {...form.register("imageUrl")} placeholder="https://..." />
          </div>

          <div className="space-y-1">
            <Label>Enviar imagem</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadImageViaApi(file, "banner", draftId);
                  if (url) {
                    form.setValue("imageUrl", url, { shouldValidate: true });
                    toast.success("Imagem enviada");
                  } else {
                    toast.error("Falha no upload");
                  }
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {imageUrl ? (
            <div className="relative aspect-[21/9] w-full max-w-md overflow-hidden rounded-md border">
              <Image
                src={imageUrl}
                alt="Prévia"
                fill
                className="object-cover"
                sizes="400px"
                unoptimized={imageUrl.startsWith("http://localhost")}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <Label>Link ao clicar (opcional)</Label>
            <Input {...form.register("link")} placeholder="https://... ou /loja" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Ordem</Label>
              <Input
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" {...form.register("active")} />
              Ativo na vitrine
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={uploading}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {banner ? "Fechar" : "Cancelar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
