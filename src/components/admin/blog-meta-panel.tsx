"use client";

import { useState } from "react";
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
}: {
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const [tab, setTab] = useState("categories");

  return (
    <Tabs value={tab} onValueChange={setTab}>
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
          window.location.reload();
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
          window.location.reload();
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
