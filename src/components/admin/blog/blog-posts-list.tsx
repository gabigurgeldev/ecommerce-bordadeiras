"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Eye,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminDuplicateBlogPost,
  adminPublishBlogPost,
  adminSoftDeleteBlogPost,
  adminUnpublishBlogPost,
  adminUpdateBlogPost,
} from "@/actions/admin/blog-ext";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { BlogStatusBadge } from "@/components/admin/blog/blog-status-badge";
import type { BlogPostRow } from "@/components/admin/blog/blog-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BlogPostStatus } from "@/lib/types/database";
import type { BlogCategory } from "@/lib/types/database";
import { cn, formatDate } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";

type SortKey = "title" | "updatedAt" | "publishedAt" | "views";
type SortDir = "asc" | "desc";

function PostThumbnail({ post }: { post: BlogPostRow }) {
  if (!post.coverImage) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative h-11 w-11 overflow-hidden rounded-md border bg-muted">
            <Image
              src={post.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
              unoptimized={post.coverImage.startsWith("http://localhost")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0">
          <div className="relative h-40 w-64 overflow-hidden rounded-md">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized={post.coverImage.startsWith("http://localhost")}
            />
          </div>
          <p className="max-w-64 p-2 text-xs">{post.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", active ? "text-foreground" : "text-muted-foreground/50")} />
    </button>
  );
}

export function BlogPostsList({
  posts,
  categories,
}: {
  posts: BlogPostRow[];
  categories: BlogCategory[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [moveCategoryOpen, setMoveCategoryOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  const authors = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.authorName) set.add(p.authorName);
    });
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const periodMs: Record<string, number> = {
      "7d": 7 * 86400000,
      "30d": 30 * 86400000,
      "90d": 90 * 86400000,
    };

    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (authorFilter !== "all" && p.authorName !== authorFilter) return false;
      if (periodFilter !== "all") {
        const ms = periodMs[periodFilter];
        if (ms) {
          const d = new Date(p.updatedAt).getTime();
          if (now - d > ms) return false;
        }
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.excerpt?.toLowerCase().includes(q) ?? false) ||
        (p.categoryName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [posts, search, statusFilter, categoryFilter, periodFilter, authorFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "title":
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          break;
        case "views":
          av = a.views;
          bv = b.views;
          break;
        case "publishedAt":
          av = a.publishedAt ?? "";
          bv = b.publishedAt ?? "";
          break;
        default:
          av = a.updatedAt;
          bv = b.updatedAt;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  const allSelected = sorted.length > 0 && sorted.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((p) => p.id)));
  }

  async function bulkPublish(publish: boolean) {
    if (!selected.size) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      const res = publish ? await adminPublishBlogPost(id) : await adminUnpublishBlogPost(id);
      if (res.success) ok++;
    }
    setBulkLoading(false);
    toast.success(`${ok} post(s) ${publish ? "publicado(s)" : "despublicado(s)"}`);
    setSelected(new Set());
    router.refresh();
  }

  async function bulkDelete() {
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      const res = await adminSoftDeleteBlogPost(id);
      if (res.success) ok++;
    }
    setBulkLoading(false);
    toast.success(`${ok} post(s) excluído(s)`);
    setSelected(new Set());
    setDeleteOpen(false);
    router.refresh();
  }

  async function bulkMoveCategory() {
    if (!targetCategoryId) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      const post = posts.find((p) => p.id === id);
      if (!post) continue;
      const res = await adminUpdateBlogPost(id, {
        title: post.title,
        content: post.content,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        youtubeUrl: post.youtubeUrl,
        status: post.status as typeof BlogPostStatus.DRAFT,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        categoryId: targetCategoryId,
        tagIds: post.tagIds,
      });
      if (res.success) ok++;
    }
    setBulkLoading(false);
    toast.success(`${ok} post(s) movido(s)`);
    setSelected(new Set());
    setMoveCategoryOpen(false);
    router.refresh();
  }

  if (posts.length === 0) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="Nenhum post"
        description="Publique conteúdo no blog da loja."
        action={
          <Button asChild>
            <Link href="/admin/blog/posts/create">
              <Plus className="mr-2 h-4 w-4" />
              Novo post
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar posts…"
        count={sorted.length}
        countLabel="posts"
        filters={
          <div className="flex flex-wrap gap-2">
            <select
              className={adminFilterSelectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value={BlogPostStatus.DRAFT}>Rascunho</option>
              <option value={BlogPostStatus.PUBLISHED}>Publicado</option>
              <option value={BlogPostStatus.SCHEDULED}>Agendado</option>
              <option value={BlogPostStatus.ARCHIVED}>Arquivado</option>
            </select>
            <select
              className={adminFilterSelectClass}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={adminFilterSelectClass}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">Todo período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            {authors.length > 0 && (
              <select
                className={adminFilterSelectClass}
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
              >
                <option value="all">Todos autores</option>
                {authors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selected.size} selecionado(s)</span>
          <Button size="sm" variant="secondary" disabled={bulkLoading} onClick={() => void bulkPublish(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Publicar
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkLoading} onClick={() => void bulkPublish(false)}>
            <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
            Despublicar
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkLoading} onClick={() => setMoveCategoryOpen(true)}>
            Mover categoria
          </Button>
          <Button size="sm" variant="destructive" disabled={bulkLoading} onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      )}

      {sorted.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Nenhum post encontrado"
          description="Ajuste os filtros ou crie um novo artigo."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    className="h-4 w-4 rounded border-input"
                  />
                </TableHead>
                <TableHead className="w-14" />
                <TableHead>
                  <SortButton label="Título" sortKey="title" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortButton label="Visualizações" sortKey="views" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <SortButton label="Atualizado" sortKey="updatedAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                </TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((post) => (
                <TableRow key={post.id} className="group">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(post.id);
                          else next.delete(post.id);
                          return next;
                        });
                      }}
                      aria-label={`Selecionar ${post.title}`}
                      className="h-4 w-4 rounded border-input"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <PostThumbnail post={post} />
                  </TableCell>
                  <TableCell className="max-w-[280px] py-3">
                    <Link href={`/admin/blog/posts/${post.id}`} className="block space-y-0.5 hover:underline">
                      <span className="line-clamp-1 font-medium">{post.title}</span>
                      {post.excerpt && (
                        <span className="line-clamp-1 text-xs text-muted-foreground">{post.excerpt}</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {post.categoryName ? (
                      <Badge variant="outline" className="font-normal">{post.categoryName}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <BlogStatusBadge status={post.status} published={post.published} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {post.views.toLocaleString("pt-BR")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(post.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/posts/${post.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const res = await adminDuplicateBlogPost(post.id);
                            if (res.success) {
                              toast.success("Post duplicado");
                              router.refresh();
                            } else toast.error(res.error);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {post.status !== BlogPostStatus.PUBLISHED ? (
                          <DropdownMenuItem
                            onClick={async () => {
                              const res = await adminPublishBlogPost(post.id);
                              if (res.success) {
                                toast.success("Post publicado");
                                router.refresh();
                              } else toast.error(res.error);
                            }}
                          >
                            Publicar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={async () => {
                              const res = await adminUnpublishBlogPost(post.id);
                              if (res.success) {
                                toast.success("Post despublicado");
                                router.refresh();
                              } else toast.error(res.error);
                            }}
                          >
                            Despublicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletePostId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deletePostId)}
        onOpenChange={(open) => {
          if (!open) setDeletePostId(null);
        }}
        title="Excluir post?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deletePostId) return;
          const res = await adminSoftDeleteBlogPost(deletePostId);
          if (res.success) {
            toast.success("Post excluído");
            setDeletePostId(null);
            router.refresh();
          } else toast.error(res.error);
        }}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir posts selecionados?"
        description={`${selected.size} post(s) serão excluídos permanentemente.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => void bulkDelete()}
      />

      <Dialog open={moveCategoryOpen} onOpenChange={setMoveCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para categoria</DialogTitle>
            <DialogDescription>
              Selecione a categoria de destino para {selected.size} post(s).
            </DialogDescription>
          </DialogHeader>
          <select
            className={adminFilterSelectClass + " w-full"}
            value={targetCategoryId}
            onChange={(e) => setTargetCategoryId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMoveCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void bulkMoveCategory()} disabled={bulkLoading}>
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
