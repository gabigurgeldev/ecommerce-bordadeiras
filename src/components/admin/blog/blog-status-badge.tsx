"use client";

import { Badge } from "@/components/ui/badge";
import { BlogPostStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  [BlogPostStatus.DRAFT]: "Rascunho",
  [BlogPostStatus.PUBLISHED]: "Publicado",
  [BlogPostStatus.SCHEDULED]: "Agendado",
  [BlogPostStatus.ARCHIVED]: "Arquivado",
};

const styles: Record<string, string> = {
  [BlogPostStatus.DRAFT]: "bg-muted text-muted-foreground",
  [BlogPostStatus.PUBLISHED]: "bg-emerald-600/90 text-white hover:bg-emerald-600/90",
  [BlogPostStatus.SCHEDULED]: "bg-amber-500/90 text-white hover:bg-amber-500/90",
  [BlogPostStatus.ARCHIVED]: "bg-secondary text-secondary-foreground",
};

export function BlogStatusBadge({
  status,
  published,
  className,
}: {
  status?: string;
  published?: boolean;
  className?: string;
}) {
  const resolved =
    status ??
    (published ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT);

  return (
    <Badge
      variant={resolved === BlogPostStatus.PUBLISHED ? "default" : "secondary"}
      className={cn("shrink-0 font-normal", styles[resolved] ?? styles[BlogPostStatus.DRAFT], className)}
    >
      {labels[resolved] ?? "Rascunho"}
    </Badge>
  );
}
