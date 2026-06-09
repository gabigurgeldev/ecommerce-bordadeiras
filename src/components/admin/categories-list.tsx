"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight,
  FolderTree,
  Grid3X3,
  List,
  FolderOpen,
  Layers,
} from "lucide-react";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/database";

type CategoryNode = Category & { children: CategoryNode[] };

function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }
  const roots: CategoryNode[] = [];
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

function flattenTree(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  const out: { node: CategoryNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
}

function filterTree(nodes: CategoryNode[], query: string): CategoryNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  function filterNode(node: CategoryNode): CategoryNode | null {
    const childMatches = node.children
      .map(filterNode)
      .filter((c): c is CategoryNode => c !== null);
    const selfMatch =
      node.name.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
    if (selfMatch || childMatches.length > 0) {
      return { ...node, children: childMatches };
    }
    return null;
  }

  return nodes.map(filterNode).filter((n): n is CategoryNode => n !== null);
}

function CategoryStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"} className="shrink-0">
      {active ? "Ativa" : "Inativa"}
    </Badge>
  );
}

function CategoryThumbnail({ category }: { category: Category }) {
  if (category.imageUrl) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
        <Image
          src={category.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
          unoptimized={category.imageUrl.startsWith("http://localhost")}
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
      <Layers className="h-4 w-4" />
    </div>
  );
}

function CategoryGridCard({
  category,
  parentName,
  childCount,
  allCategories,
}: {
  category: Category;
  parentName: string | null;
  childCount: number;
  allCategories: Category[];
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            unoptimized={category.imageUrl.startsWith("http://localhost")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/60">
            <FolderOpen className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <CategoryStatusBadge active={category.active} />
        </div>
        {childCount > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
            {childCount} sub
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-snug">{category.name}</h3>
          <p className="truncate font-mono text-xs text-muted-foreground">/{category.slug}</p>
          {parentName && (
            <p className="mt-1 truncate text-xs text-muted-foreground">Pai: {parentName}</p>
          )}
          {category.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">Ordem {category.sortOrder}</span>
          <CategoryFormDialog category={category} categories={allCategories} />
        </div>
      </div>
    </article>
  );
}

function CategoryListRow({
  node,
  depth,
  parentMap,
  allCategories,
}: {
  node: CategoryNode;
  depth: number;
  parentMap: Map<string, Category>;
  allCategories: Category[];
}) {
  const parentName = node.parentId ? parentMap.get(node.parentId)?.name ?? null : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4",
        depth > 0 && "bg-muted/20",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div style={{ paddingLeft: `${depth * 1.25}rem` }} className="flex min-w-0 flex-1 items-center gap-3">
          {depth > 0 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
          )}
          <CategoryThumbnail category={node} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{node.name}</p>
              <CategoryStatusBadge active={node.active} />
              {node.children.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {node.children.length} sub
                </Badge>
              )}
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">/{node.slug}</p>
            {parentName && (
              <p className="truncate text-xs text-muted-foreground sm:hidden">Pai: {parentName}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-6">
        <span className="hidden text-sm text-muted-foreground sm:inline">{node.sortOrder}</span>
        <span className="text-xs text-muted-foreground sm:hidden">Ordem {node.sortOrder}</span>
        <CategoryFormDialog category={node} categories={allCategories} />
      </div>
    </div>
  );
}

export function CategoriesList({
  categories,
  editCategoryId,
}: {
  categories: Category[];
  editCategoryId?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const editCategory = useMemo(
    () => (editCategoryId ? categories.find((c) => c.id === editCategoryId) ?? null : null),
    [categories, editCategoryId],
  );

  const parentMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { flat, filteredCount } = useMemo(() => {
    const fullTree = buildCategoryTree(categories);
    const filtered = filterTree(fullTree, search);
    const flatList = flattenTree(filtered);
    return { flat: flatList, filteredCount: flatList.length };
  }, [categories, search]);

  const childCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cat of categories) {
      if (cat.parentId) {
        counts.set(cat.parentId, (counts.get(cat.parentId) ?? 0) + 1);
      }
    }
    return counts;
  }, [categories]);

  if (categories.length === 0) {
    return (
      <>
        <AdminEmptyState
          icon={FolderTree}
          title="Nenhuma categoria cadastrada"
          description="Crie a primeira categoria para organizar seus produtos."
          action={<CategoryFormDialog categories={[]} />}
        />
        {editCategory && (
          <CategoryFormDialog
            category={editCategory}
            categories={categories}
            defaultOpen
            onClose={() => router.replace("/admin/categorias")}
          />
        )}
      </>
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou slug…"
        count={filteredCount}
        countLabel="categorias"
        filters={
          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Visualização em grade"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {filteredCount === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma categoria encontrada para &ldquo;{search}&rdquo;.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {flat.map(({ node }) => (
            <CategoryGridCard
              key={node.id}
              category={node}
              parentName={node.parentId ? parentMap.get(node.parentId)?.name ?? null : null}
              childCount={childCountMap.get(node.id) ?? 0}
              allCategories={categories}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="hidden border-b bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_4rem_5rem] sm:gap-4">
            <span>Categoria</span>
            <span>Ordem</span>
            <span className="text-right">Ações</span>
          </div>
          {flat.map(({ node, depth }) => (
            <CategoryListRow
              key={node.id}
              node={node}
              depth={depth}
              parentMap={parentMap}
              allCategories={categories}
            />
          ))}
        </div>
      )}

      {editCategory && (
        <CategoryFormDialog
          category={editCategory}
          categories={categories}
          defaultOpen
          onClose={() => router.replace("/admin/categorias")}
        />
      )}
    </>
  );
}
