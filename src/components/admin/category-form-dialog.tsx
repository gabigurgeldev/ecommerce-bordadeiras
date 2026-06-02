"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";
import { categorySchema } from "@/lib/validations/admin";
import { upsertCategory, deleteCategory } from "@/actions/admin/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@prisma/client";
import type { z } from "zod";

type FormValues = z.infer<typeof categorySchema>;

export function CategoryFormDialog({
  category,
  categories = [],
}: {
  category?: Category;
  categories?: Category[];
}) {
  const [open, setOpen] = useState(!!category);
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      imageUrl: category?.imageUrl ?? "",
      parentId: category?.parentId ?? "",
      sortOrder: category?.sortOrder ?? 0,
      active: category?.active ?? true,
    },
  });

  const imageUrl = form.watch("imageUrl");

  if (!open && !category) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Nova categoria
      </Button>
    );
  }

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertCategory(data, category?.id);
    if (res.success) {
      toast.success(category ? "Categoria atualizada" : "Categoria criada");
      setOpen(false);
      window.location.reload();
    } else toast.error(res.error);
  });

  return (
    <div className="rounded-lg border p-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label>Nome</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input {...form.register("slug")} />
        </div>
        <div className="space-y-1">
          <Label>Descrição</Label>
          <Textarea rows={2} {...form.register("description")} />
        </div>
        <div className="space-y-1">
          <Label>Categoria pai</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...form.register("parentId")}
          >
            <option value="">Nenhuma (raiz)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>URL da imagem</Label>
          <Input {...form.register("imageUrl")} placeholder="https://..." />
        </div>
        {imageUrl ? (
          <div className="relative aspect-square w-24 overflow-hidden rounded-md border">
            <Image
              src={imageUrl}
              alt="Prévia"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={imageUrl.startsWith("http://localhost")}
            />
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Ordem</Label>
            <Input type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" {...form.register("active")} />
            Categoria ativa
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Salvar
          </Button>
          {category && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm("Excluir categoria?")) return;
                const res = await deleteCategory(category.id);
                if (res.success) {
                  toast.success("Excluída");
                  window.location.reload();
                } else toast.error(res.error);
              }}
            >
              Excluir
            </Button>
          )}
          {!category && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
