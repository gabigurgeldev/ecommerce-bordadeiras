"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { adminEnhanceBlogText } from "@/actions/admin/blog-ext";
import { BlogAiCompareDialog } from "@/components/admin/blog/blog-ai-compare-dialog";
import { Button } from "@/components/ui/button";
import type { BlogAiEnhanceInput } from "@/lib/validations/blog";
import { cn } from "@/lib/utils";

type FieldScope = Exclude<BlogAiEnhanceInput["scope"], "generate" | "content">;

type BlogFieldAiInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  coverAlt?: string;
};

const scopeLabels: Record<FieldScope, string> = {
  title: "Sugerir título",
  excerpt: "Gerar resumo",
  seo: "Gerar SEO",
  coverAlt: "Gerar texto alt",
  tags: "Sugerir tags",
};

function formatBefore(scope: FieldScope, input: BlogFieldAiInput): string {
  switch (scope) {
    case "title":
      return input.title?.trim() || "(sem título)";
    case "excerpt":
      return input.excerpt?.trim() || "(sem resumo)";
    case "seo":
      return [
        `Meta título: ${input.seoTitle?.trim() || "(vazio)"}`,
        `Meta descrição: ${input.seoDescription?.trim() || "(vazia)"}`,
      ].join("\n");
    case "coverAlt":
      return input.coverAlt?.trim() || "(sem texto alternativo)";
    case "tags":
      return "(tags serão sugeridas com base no conteúdo)";
    default:
      return "";
  }
}

function formatAfter(scope: FieldScope, result: Record<string, string>): string {
  switch (scope) {
    case "title":
      return result.title ?? "";
    case "excerpt":
      return result.excerpt ?? "";
    case "seo":
      return [
        `Meta título: ${result.seoTitle ?? ""}`,
        `Meta descrição: ${result.seoDescription ?? ""}`,
      ].join("\n");
    case "coverAlt":
      return result.coverAlt ?? "";
    case "tags":
      return result.tags ?? "";
    default:
      return "";
  }
}

function hasResult(scope: FieldScope, result: Record<string, string>): boolean {
  switch (scope) {
    case "title":
      return Boolean(result.title?.trim());
    case "excerpt":
      return Boolean(result.excerpt?.trim());
    case "seo":
      return Boolean(result.seoTitle?.trim() || result.seoDescription?.trim());
    case "coverAlt":
      return Boolean(result.coverAlt?.trim());
    case "tags":
      return Boolean(result.tags?.trim());
    default:
      return false;
  }
}

type BlogFieldAiButtonProps = {
  scope: FieldScope;
  input: BlogFieldAiInput;
  onApply: (fields: Record<string, string>) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

export function BlogFieldAiButton({
  scope,
  input,
  onApply,
  disabled,
  label,
  className,
  variant = "outline",
  size = "sm",
}: BlogFieldAiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [pendingApply, setPendingApply] = useState<Record<string, string> | null>(null);

  async function handleClick() {
    setLoading(true);
    setCompareOpen(true);
    setBeforeText(formatBefore(scope, input));
    setAfterText("");
    setPendingApply(null);

    const res = await adminEnhanceBlogText({
      scope,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      coverAlt: input.coverAlt,
    });

    setLoading(false);

    if (!res.success) {
      toast.error(res.error ?? "Falha na IA");
      setCompareOpen(false);
      return;
    }

    const result = res.data ?? {};
    if (!hasResult(scope, result)) {
      toast.error("A IA não retornou conteúdo válido");
      setCompareOpen(false);
      return;
    }

    setAfterText(formatAfter(scope, result));
    setPendingApply(result);
  }

  function handleAccept() {
    if (pendingApply) {
      onApply(pendingApply);
      toast.success("Alteração aplicada — revise antes de publicar");
    }
    setCompareOpen(false);
    setPendingApply(null);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={disabled || loading}
        onClick={() => void handleClick()}
      >
        {loading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        )}
        {label ?? scopeLabels[scope]}
      </Button>

      <BlogAiCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        title={scopeLabels[scope]}
        before={beforeText}
        after={afterText}
        loading={loading}
        onAccept={handleAccept}
        onAcceptAndEdit={handleAccept}
        onReject={() => {
          setCompareOpen(false);
          setPendingApply(null);
        }}
      />
    </>
  );
}
