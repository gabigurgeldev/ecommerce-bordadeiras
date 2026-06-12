"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { adminEnhanceBlogText } from "@/actions/admin/blog-ext";
import { BlogAiCompareDialog } from "@/components/admin/blog/blog-ai-compare-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InsertMode = "replace" | "append";

type BlogContentAiButtonProps = {
  title: string;
  content: string;
  disabled?: boolean;
  onApply: (content: string) => void;
};

export function BlogContentAiButton({
  title,
  content,
  disabled,
  onApply,
}: BlogContentAiButtonProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [insertMode, setInsertMode] = useState<InsertMode>("replace");
  const [loading, setLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (trimmed.length < 10) {
      toast.error("Descreva o que deseja gerar (mínimo 10 caracteres)");
      return;
    }

    setPromptOpen(false);
    setCompareOpen(true);
    setGeneratedContent("");
    setLoading(true);

    const res = await adminEnhanceBlogText({
      scope: "generate",
      title: title || "Novo post",
      content,
      prompt: trimmed,
    });

    setLoading(false);

    if (!res.success) {
      toast.error(res.error ?? "Falha ao gerar conteúdo");
      setCompareOpen(false);
      return;
    }

    const generated = res.data?.content ?? "";
    if (!generated) {
      toast.error("A IA não retornou conteúdo");
      setCompareOpen(false);
      return;
    }

    setGeneratedContent(generated);
  }

  function applyContent(generated: string) {
    if (insertMode === "append" && content.trim()) {
      onApply(`${content}${generated}`);
    } else {
      onApply(generated);
    }
    toast.success("Conteúdo aplicado");
    setCompareOpen(false);
    setGeneratedContent("");
    setPrompt("");
  }

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setPromptOpen(true)}
      >
        {loading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        )}
        Gerar com IA
      </Button>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar conteúdo com IA</DialogTitle>
            <DialogDescription>
              Descreva o tema, tom e estrutura desejados. Revise o resultado antes de aplicar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">O que você quer gerar?</Label>
              <Textarea
                id="ai-prompt"
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex.: Artigo sobre como escolher a linha ideal para bordado em jeans, tom didático, com 3 seções e dicas práticas…"
              />
            </div>
            <div className="space-y-2">
              <Label>Como aplicar</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={insertMode === "replace" ? "default" : "outline"}
                  onClick={() => setInsertMode("replace")}
                >
                  Substituir conteúdo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={insertMode === "append" ? "default" : "outline"}
                  onClick={() => setInsertMode("append")}
                  disabled={!content.trim()}
                >
                  Inserir no final
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPromptOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleGenerate()} disabled={prompt.trim().length < 10}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BlogAiCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        title="Conteúdo gerado pela IA"
        before={content || "(vazio)"}
        after={generatedContent}
        afterIsHtml
        loading={loading}
        onAccept={() => applyContent(generatedContent)}
        onAcceptAndEdit={() => applyContent(generatedContent)}
        onReject={() => {
          setCompareOpen(false);
          setGeneratedContent("");
        }}
      />
    </>
  );
}
