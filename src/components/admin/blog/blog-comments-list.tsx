"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminApproveBlogComment,
  adminDeleteBlogComment,
  adminRejectBlogComment,
} from "@/actions/admin/blog-ext";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export type BlogCommentRow = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
};

export function BlogCommentsList({ comments }: { comments: BlogCommentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "spam">("pending");
  const [confirmAction, setConfirmAction] = useState<{
    type: "reject" | "delete";
    id: string;
    authorName: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comments.filter((c) => {
      if (statusFilter === "pending" && c.isApproved) return false;
      if (statusFilter === "approved" && !c.isApproved) return false;
      if (statusFilter === "spam" && c.isApproved) return false;
      if (!q) return true;
      return (
        c.authorName.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.postTitle.toLowerCase().includes(q)
      );
    });
  }, [comments, search, statusFilter]);

  async function handleApprove(id: string) {
    const res = await adminApproveBlogComment(id);
    if (res.success) {
      toast.success("Comentário aprovado");
      router.refresh();
    } else toast.error(res.error);
  }

  async function handleReject(id: string) {
    const res = await adminRejectBlogComment(id);
    if (res.success) {
      toast.success("Comentário rejeitado");
      router.refresh();
    } else toast.error(res.error);
  }

  async function handleDelete(id: string) {
    const res = await adminDeleteBlogComment(id);
    if (res.success) {
      toast.success("Comentário excluído");
      router.refresh();
    } else toast.error(res.error);
  }

  if (comments.length === 0) {
    return (
      <AdminEmptyState
        icon={MessageSquare}
        title="Nenhum comentário"
        description="Comentários dos leitores aparecerão aqui para moderação."
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar comentários…"
        count={filtered.length}
        countLabel="comentários"
        filters={
          <select
            className={adminFilterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="spam">Spam / rejeitados</option>
            <option value="all">Todos</option>
          </select>
        }
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={MessageSquare}
          title="Nenhum comentário encontrado"
          description="Ajuste os filtros ou aguarde novos comentários dos leitores."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Autor</TableHead>
                <TableHead className="hidden md:table-cell">Post</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.authorName}</p>
                      <p className="text-xs text-muted-foreground">{c.authorEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[180px]">
                    <Link
                      href={`/admin/blog/posts/${c.postId}`}
                      className="line-clamp-2 text-sm hover:underline"
                    >
                      {c.postTitle}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="line-clamp-3 text-sm">{c.content}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isApproved ? "default" : "secondary"}>
                      {c.isApproved ? "Aprovado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!c.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600"
                          onClick={() => void handleApprove(c.id)}
                          aria-label="Aprovar"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {c.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setConfirmAction({ type: "reject", id: c.id, authorName: c.authorName })
                          }
                          aria-label="Rejeitar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setConfirmAction({ type: "delete", id: c.id, authorName: c.authorName })
                        }
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminConfirmDialog
        open={confirmAction?.type === "reject"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Rejeitar comentário?"
        description={
          confirmAction
            ? `O comentário de ${confirmAction.authorName} será marcado como rejeitado e deixará de aparecer no blog.`
            : ""
        }
        confirmLabel="Rejeitar"
        destructive
        onConfirm={async () => {
          if (!confirmAction) return;
          await handleReject(confirmAction.id);
          setConfirmAction(null);
        }}
      />

      <AdminConfirmDialog
        open={confirmAction?.type === "delete"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Excluir comentário?"
        description={
          confirmAction
            ? `O comentário de ${confirmAction.authorName} será removido permanentemente.`
            : ""
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!confirmAction) return;
          await handleDelete(confirmAction.id);
          setConfirmAction(null);
        }}
      />
    </>
  );
}
