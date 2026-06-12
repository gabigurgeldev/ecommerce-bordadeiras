"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { adminCreateBlogCategory, adminUpdateBlogCategory } from "@/actions/admin/blog-ext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BlogCategory } from "@/lib/types/database";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(120).optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const ICONS = ["📁", "✂️", "🧵", "💡", "📰", "🎨", "🛠️", "⭐"];

export function BlogCategoryFormDialog({
  category,
  open,
  onOpenChange,
  onCreated,
  onUpdated,
}: {
  category?: BlogCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (cat: BlogCategory) => void;
  onUpdated?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(category);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "📁",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        description: category?.description ?? "",
        icon: category?.icon ?? "📁",
        isActive: category?.isActive ?? true,
      });
    }
  }, [open, category, form]);

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    const payload = {
      ...data,
      slug: data.slug?.trim() || slugify(data.name),
      description: data.description || null,
      icon: data.icon || null,
    };

    const res = isEdit
      ? await adminUpdateBlogCategory(category!.id, payload)
      : await adminCreateBlogCategory(payload);

    setSubmitting(false);

    if (res.success) {
      toast.success(isEdit ? "Categoria atualizada" : "Categoria criada");
      onOpenChange(false);
      if (!isEdit && res.data?.id && onCreated) {
        onCreated({
          id: res.data.id,
          name: data.name,
          slug: payload.slug,
          description: payload.description ?? null,
          icon: payload.icon,
          postsCount: 0,
          isActive: data.isActive ?? true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      onUpdated?.();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Organize os posts do blog por temas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input id="cat-name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" {...form.register("slug")} placeholder="gerado-automaticamente" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descrição</Label>
            <Textarea id="cat-desc" rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg ${
                    form.watch("icon") === icon ? "border-primary bg-primary/10" : ""
                  }`}
                  onClick={() => form.setValue("icon", icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Ativa</Label>
            <Switch
              id="cat-active"
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
