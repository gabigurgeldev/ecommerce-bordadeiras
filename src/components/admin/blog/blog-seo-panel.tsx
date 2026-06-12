"use client";

import { computeSeoScore } from "@/components/admin/blog/blog-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

export function BlogSeoPanel({
  title,
  slug,
  seoTitle,
  seoDescription,
  excerpt,
  content,
  coverImage,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  content: string;
  coverImage: string;
  onSeoTitleChange: (v: string) => void;
  onSeoDescriptionChange: (v: string) => void;
}) {
  const { score, tips } = computeSeoScore({
    title,
    seoTitle,
    seoDescription,
    excerpt,
    content,
    coverImage,
  });

  const displayTitle = (seoTitle || title).slice(0, SEO_TITLE_MAX);
  const displayDesc = (seoDescription || excerpt).slice(0, SEO_DESC_MAX);
  const url = `${siteConfig.url}/blog/${slug || "slug-do-post"}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-title">Meta título</Label>
          <span className="text-xs text-muted-foreground">
            {seoTitle.length}/{SEO_TITLE_MAX}
          </span>
        </div>
        <Input
          id="seo-title"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value.slice(0, SEO_TITLE_MAX))}
          placeholder={title || "Título para buscadores"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-desc">Meta descrição</Label>
          <span className="text-xs text-muted-foreground">
            {seoDescription.length}/{SEO_DESC_MAX}
          </span>
        </div>
        <Textarea
          id="seo-desc"
          rows={3}
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value.slice(0, SEO_DESC_MAX))}
          placeholder="Descrição para resultados de busca…"
        />
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Prévia Google</p>
        <p className="truncate text-sm text-[#1a0dab]">{displayTitle} | {siteConfig.name}</p>
        <p className="truncate text-xs text-[#006621]">{url}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{displayDesc || "Sem descrição"}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pontuação SEO</span>
          <span
            className={cn(
              "text-sm font-bold",
              score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-destructive",
            )}
          >
            {score}/100
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all",
              score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-destructive",
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        {tips.length > 0 && (
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {tips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
