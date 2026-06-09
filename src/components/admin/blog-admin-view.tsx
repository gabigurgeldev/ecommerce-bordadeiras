"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, FileText, ImageIcon, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { BlogMetaPanel } from "@/components/admin/blog-meta-panel";
import {
  BlogPostCreateWizard,
  BlogPostEditWizard,
  type BlogPostEditData,
} from "@/components/admin/blog-post-form";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import type { BlogCategory, BlogTag } from "@/lib/types/database";

type PostRow = BlogPostEditData & {
  updatedAt: string | Date;
  categoryName: string | null;
};

function postToEditData(post: PostRow): BlogPostEditData {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    published: post.published,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    categoryId: post.categoryId,
    tagIds: post.tagIds,
  };
}

function BlogStatusBadge({ published }: { published: boolean }) {
  return (
    <Badge
      variant={published ? "default" : "secondary"}
      className={cn(
        "shrink-0 font-normal",
        published
          ? "bg-emerald-600/90 hover:bg-emerald-600/90"
          : "bg-muted text-muted-foreground",
      )}
    >
      {published ? "Publicado" : "Rascunho"}
    </Badge>
  );
}

function PostCover({
  coverImage,
  title,
  className,
}: {
  coverImage: string | null;
  title: string;
  className?: string;
}) {
  if (coverImage) {
    return (
      <div className={cn("relative overflow-hidden rounded-md border bg-muted", className)}>
        <Image
          src={coverImage}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 80px, 48px"
          unoptimized={coverImage.startsWith("http://localhost")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <ImageIcon className="h-4 w-4" aria-hidden />
      <span className="sr-only">Sem capa: {title}</span>
    </div>
  );
}

function BlogPostsList({
  posts,
  categories,
  tags,
  onEditPost,
}: {
  posts: PostRow[];
  categories: BlogCategory[];
  tags: BlogTag[];
  onEditPost: (post: BlogPostEditData) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter === "published" && !p.published) return false;
      if (statusFilter === "draft" && p.published) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.excerpt?.toLowerCase().includes(q) ?? false) ||
        (p.categoryName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [posts, search, statusFilter]);

  if (posts.length === 0) {
    return (
      <>
        <AdminEmptyState
          icon={FileText}
          title="Nenhum post"
          description="Publique conteúdo no blog da loja."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo post
            </Button>
          }
        />
        <BlogPostCreateWizard
          categories={categories}
          tags={tags}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </>
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar posts…"
        count={filteredPosts.length}
        countLabel="posts"
        filters={
          <select
            className={adminFilterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
        }
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo post
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum post corresponde aos filtros.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => onEditPost(postToEditData(post))}
                  className="flex w-full gap-3 p-3 text-left"
                >
                  <PostCover
                    coverImage={post.coverImage}
                    title={post.title}
                    className="h-20 w-20 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-medium leading-snug">{post.title}</h3>
                      <BlogStatusBadge published={post.published} />
                    </div>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {post.categoryName && (
                        <Badge variant="outline" className="font-normal">
                          {post.categoryName}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-14" />
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Atualizado</TableHead>
                  <TableHead className="w-16 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} className="group">
                    <TableCell className="py-3">
                      <PostCover
                        coverImage={post.coverImage}
                        title={post.title}
                        className="h-11 w-11"
                      />
                    </TableCell>
                    <TableCell className="max-w-[280px] py-3">
                      <button
                        type="button"
                        onClick={() => onEditPost(postToEditData(post))}
                        className="block w-full space-y-0.5 text-left hover:underline"
                      >
                        <span className="line-clamp-1 font-medium">{post.title}</span>
                        {post.excerpt && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {post.excerpt}
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {post.categoryName ? (
                        <Badge variant="outline" className="font-normal">
                          {post.categoryName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <BlogStatusBadge published={post.published} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                        onClick={() => onEditPost(postToEditData(post))}
                        aria-label={`Editar ${post.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <BlogPostCreateWizard
        categories={categories}
        tags={tags}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}

export function BlogAdminView({
  posts,
  categories,
  tags,
}: {
  posts: PostRow[];
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "posts";
  const editId = searchParams.get("edit");
  const [editPost, setEditPost] = useState<BlogPostEditData | null>(null);

  useEffect(() => {
    if (!editId) return;

    const post = posts.find((p) => p.id === editId);
    if (post) {
      setEditPost(postToEditData(post));
    } else {
      toast.error("Post não encontrado");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const query = params.toString();
    router.replace(query ? `/admin/blog?${query}` : "/admin/blog");
  }, [editId, posts, router, searchParams]);

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/admin/blog?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 p-1">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        <BlogPostsList
          posts={posts}
          categories={categories}
          tags={tags}
          onEditPost={setEditPost}
        />
        {editPost && (
          <BlogPostEditWizard
            post={editPost}
            categories={categories}
            tags={tags}
            open
            onOpenChange={(open) => {
              if (!open) setEditPost(null);
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="categories">
        <BlogMetaPanel mode="categories" categories={categories} tags={tags} />
      </TabsContent>

      <TabsContent value="tags">
        <BlogMetaPanel mode="tags" categories={categories} tags={tags} />
      </TabsContent>
    </Tabs>
  );
}
