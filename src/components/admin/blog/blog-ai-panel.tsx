"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { adminEnhanceBlogText } from "@/actions/admin/blog-ext";
import { BlogAiCompareDialog } from "@/components/admin/blog/blog-ai-compare-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AiHistoryEntry = {
  id: string;
  action: string;
  timestamp: Date;
};

type BlogAiPanelProps = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  selectedText?: string;
  onApply: (fields: Record<string, string>) => void;
};

const selectionActions = [
  { id: "improve", label: "Melhorar", prompt: "Melhore este trecho mantendo o sentido" },
  { id: "formal", label: "Formal", prompt: "Reescreva em tom formal" },
  { id: "casual", label: "Casual", prompt: "Reescreva em tom casual e amigável" },
  { id: "summarize", label: "Resumir", prompt: "Resuma este trecho" },
  { id: "expand", label: "Expandir", prompt: "Expanda este trecho com mais detalhes" },
  { id: "grammar", label: "Gramática", prompt: "Corrija gramática e ortografia" },
] as const;

const globalActions = [
  { scope: "title" as const, label: "Sugerir título" },
  { scope: "content" as const, label: "Melhorar post completo" },
  { scope: "seo" as const, label: "Gerar meta descrição" },
  { scope: "excerpt" as const, label: "Gerar resumo" },
] as const;

export function BlogAiPanel({
  title,
  excerpt,
  content,
  seoTitle,
  seoDescription,
  selectedText,
  onApply,
}: BlogAiPanelProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AiHistoryEntry[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareTitle, setCompareTitle] = useState("");
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [pendingApply, setPendingApply] = useState<Record<string, string> | null>(null);

  async function runEnhance(
    scope: "content" | "seo" | "excerpt" | "title",
    actionLabel: string,
    overrideContent?: string,
  ) {
    setLoading(true);
    setCompareOpen(true);
    setCompareTitle(actionLabel);
    setBeforeText(overrideContent ?? content);
    setAfterText("");

    const res = await adminEnhanceBlogText({
      scope,
      title,
      excerpt,
      content: overrideContent ?? content,
      seoTitle,
      seoDescription,
    });

    setLoading(false);

    if (!res.success) {
      toast.error(res.error ?? "Falha na IA");
      setCompareOpen(false);
      return;
    }

    const result = res.data!;
    const after =
      result.content ?? result.excerpt ?? result.seoTitle ?? result.seoDescription ?? result.title ?? "";
    setAfterText(after);
    setPendingApply(result);
    setHistory((h) => [
      { id: crypto.randomUUID(), action: actionLabel, timestamp: new Date() },
      ...h.slice(0, 9),
    ]);
  }

  async function runSelectionAction(action: (typeof selectionActions)[number]) {
    if (!selectedText?.trim()) {
      toast.error("Selecione um trecho no editor");
      return;
    }
    await runEnhance("content", action.label, `${action.prompt}:\n\n${selectedText}`);
  }

  function handleAccept() {
    if (pendingApply) {
      onApply(pendingApply);
      toast.success("Alteração aplicada");
    }
    setCompareOpen(false);
    setPendingApply(null);
  }

  function handleAcceptAndEdit() {
    handleAccept();
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Assistente IA
          </CardTitle>
          <CardDescription>Melhore textos com IA. Revise sempre antes de publicar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedText && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Seleção ({selectedText.length} chars)</p>
              <div className="flex flex-wrap gap-1">
                {selectionActions.map((a) => (
                  <Button
                    key={a.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={loading}
                    onClick={() => void runSelectionAction(a)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Ações globais</p>
            <div className="flex flex-wrap gap-1">
              {globalActions.map((a) => (
                <Button
                  key={a.scope}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={loading || !title.trim()}
                  onClick={() => void runEnhance(a.scope, a.label)}
                >
                  {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-1 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Histórico da sessão ({history.length})</p>
              <ul className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                {history.map((h) => (
                  <li key={h.id}>
                    {h.action} — {h.timestamp.toLocaleTimeString("pt-BR")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <BlogAiCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        title={compareTitle}
        before={beforeText}
        after={afterText}
        loading={loading}
        onAccept={handleAccept}
        onAcceptAndEdit={handleAcceptAndEdit}
        onReject={() => {
          setCompareOpen(false);
          setPendingApply(null);
        }}
      />
    </>
  );
}
