"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { blogPostSchema } from "@/lib/validations/admin";
import { upsertBlogPost, deleteBlogPost } from "@/actions/admin/blog";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogCategory, BlogPost, BlogTag } from "@prisma/client";
import type { z } from "zod";

type PostWithTags = BlogPost & {
  tags: { tag: BlogTag }[];
};

type FormValues = z.infer<typeof blogPostSchema>;

export function BlogPostForm({
  post,
  categories,
  tags,
}: {
  post?: PostWithTags;
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      coverImage: post?.coverImage ?? "",
      published: post?.published ?? false,
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      categoryId: post?.categoryId ?? "",
      tagIds: post?.tags.map((t) => t.tag.id) ?? [],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertBlogPost(
      { ...data, slug: data.slug || slugify(data.title) },
      post?.id,
    );
    if (res.success) {
      toast.success("Post salvo");
      router.push("/admin/blog");
      router.refresh();
    } else toast.error(res.error);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Título</Label>
        <Input {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input {...form.register("slug")} />
      </div>
      <div className="space-y-2">
        <Label>Resumo</Label>
        <Textarea rows={2} {...form.register("excerpt")} />
      </div>
      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea rows={10} {...form.register("content")} />
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <select className="flex h-9 w-full rounded-md border px-3 text-sm" {...form.register("categoryId")}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                value={tag.id}
                {...form.register("tagIds")}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>SEO título</Label>
          <Input {...form.register("seoTitle")} />
        </div>
        <div className="space-y-2">
          <Label>Imagem de capa (URL)</Label>
          <Input {...form.register("coverImage")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>SEO descrição</Label>
        <Textarea rows={2} {...form.register("seoDescription")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("published")} />
        Publicado
      </label>
      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        {post && (
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!confirm("Excluir post?")) return;
              const res = await deleteBlogPost(post.id);
              if (res.success) {
                toast.success("Post excluído");
                router.push("/admin/blog");
              } else toast.error(res.error);
            }}
          >
            Excluir
          </Button>
        )}
      </div>
    </form>
  );
}
