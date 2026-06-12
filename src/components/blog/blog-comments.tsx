"use client";

import { submitPublicBlogComment } from "@/actions/blog";
import { getAvatarColor, getInitials } from "@/lib/blog/public-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import type { BlogCommentPublic } from "@/lib/blog/types";
import { CheckCircle2, MessageSquare, Reply, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type CommentWithReplies = BlogCommentPublic & { replies: BlogCommentPublic[] };

function buildCommentTree(comments: BlogCommentPublic[]): CommentWithReplies[] {
  const roots = comments.filter((c) => !c.parentId);
  return roots.map((root) => ({
    ...root,
    replies: comments.filter((c) => c.parentId === root.id),
  }));
}

function CommentAvatar({ name }: { name: string }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white ${getAvatarColor(name)}`}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: BlogCommentPublic;
  onReply: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <CommentAvatar name={comment.authorName} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-sm font-semibold text-[var(--color-brown)] sm:text-base">
            {comment.authorName}
          </span>
          <time className="text-xs text-[var(--muted-foreground)]">
            {formatDate(comment.createdAt)}
          </time>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/85 sm:text-[0.9375rem]">
          {comment.content}
        </p>
        {!comment.parentId && (
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-cta)] transition hover:bg-[var(--secondary)]"
          >
            <Reply className="h-3.5 w-3.5" />
            Responder
          </button>
        )}
      </div>
    </div>
  );
}

export function BlogCommentsSection({
  postId,
  comments,
}: {
  postId: string;
  comments: BlogCommentPublic[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [form, setForm] = useState({ authorName: "", authorEmail: "", content: "", website: "" });

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.website) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitPublicBlogComment({
        postId,
        authorName: form.authorName,
        authorEmail: form.authorEmail,
        content: form.content,
        parentId: replyTo,
      });

      if (result.success) {
        setSuccess(true);
        setForm({ authorName: "", authorEmail: "", content: "", website: "" });
        setReplyTo(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="mt-14 scroll-mt-24 border-t border-[var(--color-card-border)] pt-10 sm:mt-16 sm:pt-12" id="comentarios">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
          <MessageSquare className="h-5 w-5 text-[var(--color-green)]" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-brown)]">
            Comentários
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {comments.length === 0
              ? "Seja o primeiro a comentar este artigo."
              : `${comments.length} ${comments.length === 1 ? "comentário publicado" : "comentários publicados"}`}
          </p>
        </div>
      </div>

      {tree.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {tree.map((comment) => (
            <li
              key={comment.id}
              className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm sm:p-6"
            >
              <CommentItem comment={comment} onReply={setReplyTo} />
              {comment.replies.length > 0 && (
                <ul className="mt-5 space-y-4 border-l-2 border-[var(--color-green)]/40 pl-4 sm:pl-6">
                  {comment.replies.map((reply) => (
                    <li
                      key={reply.id}
                      className="rounded-xl bg-[var(--secondary)]/25 p-4"
                    >
                      <CommentItem comment={reply} onReply={setReplyTo} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--secondary)]/20 px-6 py-12 text-center">
          <MessageSquare className="h-10 w-10 text-[var(--color-price)]/50" aria-hidden />
          <p className="mt-3 font-display text-lg font-semibold text-[var(--color-brown)]">
            Nenhum comentário ainda
          </p>
          <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
            Compartilhe sua opinião ou dúvida — todos os comentários passam por moderação antes de
            serem publicados.
          </p>
        </div>
      )}

      <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-card-border)] bg-[var(--secondary)]/30 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--color-brown)]">
                {replyTo ? "Responder comentário" : "Deixe seu comentário"}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Seu comentário será revisado antes da publicação.
              </p>
            </div>
            {replyTo && (
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-cta)] transition hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="absolute -left-[9999px]" aria-hidden>
            <Label htmlFor="blog-comment-website">Website</Label>
            <Input
              id="blog-comment-website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="comment-name">Nome *</Label>
              <Input
                id="comment-name"
                required
                minLength={2}
                placeholder="Seu nome"
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                className="mt-1.5 bg-[var(--secondary)]/20"
              />
            </div>
            <div>
              <Label htmlFor="comment-email">E-mail *</Label>
              <Input
                id="comment-email"
                type="email"
                required
                placeholder="seu@email.com"
                value={form.authorEmail}
                onChange={(e) => setForm((f) => ({ ...f, authorEmail: e.target.value }))}
                className="mt-1.5 bg-[var(--secondary)]/20"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="comment-content">Mensagem *</Label>
            <Textarea
              id="comment-content"
              required
              minLength={10}
              rows={4}
              placeholder="Escreva seu comentário aqui…"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="mt-1.5 bg-[var(--secondary)]/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p
              className="flex items-center gap-2 rounded-lg bg-[var(--color-green)]/10 px-3 py-2 text-sm text-[var(--color-green)]"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Comentário enviado! Aguarde a moderação para publicação.
            </p>
          )}

          <Button type="submit" disabled={pending} className="gap-2">
            <Send className="h-4 w-4" />
            {pending ? "Enviando…" : "Enviar comentário"}
          </Button>
        </form>
      </div>
    </section>
  );
}
