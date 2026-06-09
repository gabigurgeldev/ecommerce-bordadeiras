"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { blogCategorySchema, blogTagSchema } from "@/lib/validations/admin";
import { upsertBlogCategory, upsertBlogTag } from "@/actions/admin/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlogCategory, BlogTag } from "@/lib/types/database";
import type { z } from "zod";

export function BlogMetaPanel({
  categories,
  tags,
  mode,
}: {
  categories: BlogCategory[] | { id: string; name: string; slug: string }[];
  tags: BlogTag[] | { id: string; name: string; slug: string }[];
  mode?: "categories" | "tags";
}) {
  if (mode === "categories") {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <QuickCategoryForm />
        <ul className="text-sm space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">/{c.slug}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (mode === "tags") {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <QuickTagForm />
        <ul className="text-sm space-y-2">
          {tags.map((t) => (
            <li key={t.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
              <span className="font-medium">{t.name}</span>
              <span className="text-muted-foreground">/{t.slug}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Tabs defaultValue="categories">
      <TabsList>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>
      <TabsContent value="categories" className="space-y-4">
        <QuickCategoryForm />
        <ul className="text-sm space-y-1">
          {categories.map((c) => (
            <li key={c.id}>
              {c.name} <span className="text-muted-foreground">/{c.slug}</span>
            </li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="tags" className="space-y-4">
        <QuickTagForm />
        <ul className="text-sm space-y-1">
          {tags.map((t) => (
            <li key={t.id}>
              {t.name} <span className="text-muted-foreground">/{t.slug}</span>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}

function QuickCategoryForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof blogCategorySchema>>({
    resolver: zodResolver(blogCategorySchema),
    defaultValues: { name: "", slug: "" },
  });

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={form.handleSubmit(async (data) => {
        const res = await upsertBlogCategory(data);
        if (res.success) {
          toast.success("Categoria criada");
          form.reset();
          router.refresh();
        } else toast.error(res.error);
      })}
    >
      <div>
        <Label className="sr-only">Nome</Label>
        <Input placeholder="Nome" {...form.register("name")} />
      </div>
      <div>
        <Label className="sr-only">Slug</Label>
        <Input placeholder="slug" {...form.register("slug")} />
      </div>
      <Button type="submit" size="sm">
        Adicionar
      </Button>
    </form>
  );
}

function QuickTagForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof blogTagSchema>>({
    resolver: zodResolver(blogTagSchema),
    defaultValues: { name: "", slug: "" },
  });

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={form.handleSubmit(async (data) => {
        const res = await upsertBlogTag(data);
        if (res.success) {
          toast.success("Tag criada");
          form.reset();
          router.refresh();
        } else toast.error(res.error);
      })}
    >
      <Input placeholder="Nome" {...form.register("name")} />
      <Input placeholder="slug" {...form.register("slug")} />
      <Button type="submit" size="sm">
        Adicionar
      </Button>
    </form>
  );
}
