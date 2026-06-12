"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteBlogCategory,
  adminReorderBlogCategories,
  adminToggleBlogCategoryActive,
} from "@/actions/admin/blog-ext";
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
import { BlogCategoryFormDialog } from "@/components/admin/blog/blog-category-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { BlogCategory } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function BlogCategoriesList({ categories: initial }: { categories: BlogCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<BlogCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<BlogCategory | null>(null);
  const [moveToCategoryId, setMoveToCategoryId] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    );
  }, [categories, search]);

  const persistOrder = useCallback(
    async (items: BlogCategory[]) => {
      const res = await adminReorderBlogCategories({
        items: items.map((c, i) => ({ id: c.id, sortOrder: i })),
      });
      if (res.success) {
        toast.success("Ordem atualizada");
        router.refresh();
      } else toast.error(res.error);
    },
    [router],
  );

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const fromIdx = categories.findIndex((c) => c.id === dragId);
    const toIdx = categories.findIndex((c) => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const next = [...categories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i }));
    setCategories(reordered);
    setDragId(null);
    void persistOrder(reordered);
  }

  if (categories.length === 0) {
    return (
      <>
        <AdminEmptyState
          icon={FolderTree}
          title="Nenhuma categoria"
          description="Crie categorias para organizar os posts do blog."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova categoria
            </Button>
          }
        />
        <BlogCategoryFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(cat) => {
            setCategories((c) => [...c, cat]);
            router.refresh();
          }}
        />
      </>
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar categorias…"
        count={filtered.length}
        countLabel="categorias"
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={FolderTree}
          title="Nenhuma categoria encontrada"
          description="Tente outro termo de busca ou crie uma nova categoria."
        />
      ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cat) => (
          <article
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(cat.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(cat.id)}
            className={cn(
              "group flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              dragId === cat.id && "opacity-50",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                <span className="text-2xl">{cat.icon ?? "📁"}</span>
                <div>
                  <h3 className="font-medium">{cat.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
              </div>
              <Badge variant={cat.isActive ? "default" : "secondary"}>
                {cat.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            {cat.description && (
              <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{cat.description}</p>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">{cat.postsCount} posts</span>
              <div className="flex items-center gap-1">
                <Switch
                  checked={cat.isActive}
                  onCheckedChange={async (v) => {
                    const res = await adminToggleBlogCategoryActive(cat.id);
                    if (res.success) {
                      setCategories((cs) =>
                        cs.map((c) => (c.id === cat.id ? { ...c, isActive: v } : c)),
                      );
                    } else toast.error(res.error);
                  }}
                  aria-label={`Alternar ${cat.name}`}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCategory(cat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteCategory(cat)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}

      <BlogCategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(cat) => {
          setCategories((c) => [...c, cat]);
          router.refresh();
        }}
      />

      {editCategory && (
        <BlogCategoryFormDialog
          category={editCategory}
          open
          onOpenChange={(o) => {
            if (!o) setEditCategory(null);
          }}
          onUpdated={() => {
            setEditCategory(null);
            router.refresh();
          }}
        />
      )}

      <Dialog open={Boolean(deleteCategory)} onOpenChange={(o) => { if (!o) setDeleteCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir categoria?</DialogTitle>
            <DialogDescription>
              {deleteCategory && deleteCategory.postsCount > 0
                ? `Esta categoria tem ${deleteCategory.postsCount} post(s). Mova-os para outra categoria antes de excluir.`
                : "Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          {deleteCategory && deleteCategory.postsCount > 0 && (
            <select
              className={adminFilterSelectClass + " w-full"}
              value={moveToCategoryId}
              onChange={(e) => setMoveToCategoryId(e.target.value)}
            >
              <option value="">Selecione categoria de destino…</option>
              {categories
                .filter((c) => c.id !== deleteCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteCategory(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteCategory) return;
                if (deleteCategory.postsCount > 0 && !moveToCategoryId) {
                  toast.error("Selecione uma categoria de destino");
                  return;
                }
                const res = await adminDeleteBlogCategory(deleteCategory.id);
                if (res.success) {
                  toast.success("Categoria excluída");
                  setCategories((c) => c.filter((x) => x.id !== deleteCategory.id));
                  setDeleteCategory(null);
                  router.refresh();
                } else if (!res.success) {
                  toast.error(res.error);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
