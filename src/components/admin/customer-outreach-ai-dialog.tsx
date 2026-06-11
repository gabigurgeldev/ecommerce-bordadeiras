"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateCustomerOutreachMessage } from "@/actions/admin/customer-outreach";
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
import { cn } from "@/lib/utils";
import type { CustomerOutreachAiMode } from "@/lib/validations/customer-outreach";

type CustomerOutreachAiDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (message: string) => void;
};

export function CustomerOutreachAiDialog({
  userId,
  open,
  onOpenChange,
  onGenerated,
}: CustomerOutreachAiDialogProps) {
  const [mode, setMode] = useState<CustomerOutreachAiMode>("auto");
  const [guidance, setGuidance] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!loading) {
      onOpenChange(next);
      if (!next) {
        setMode("auto");
        setGuidance("");
      }
    }
  }

  async function handleGenerate() {
    if (mode === "guided" && guidance.trim().length < 3) {
      toast.error("Descreva como quer a mensagem (mínimo 3 caracteres)");
      return;
    }

    setLoading(true);
    try {
      const result = await generateCustomerOutreachMessage({
        userId,
        mode,
        guidance: mode === "guided" ? guidance.trim() : undefined,
      });

      if (result.success && result.data) {
        onGenerated(result.data.message);
        handleOpenChange(false);
        toast.success("Mensagem gerada — revise antes de enviar");
      } else if (!result.success) {
        toast.error(result.error ?? "Falha ao gerar mensagem com IA");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerar mensagem com IA
          </DialogTitle>
          <DialogDescription>
            A IA analisa o perfil do cliente e cria uma mensagem personalizada
            para WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setMode("auto")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                mode === "auto"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Wand2 className="h-4 w-4" />
                Automático
              </span>
              <span className="text-xs text-muted-foreground">
                A IA escolhe o melhor ângulo com base no perfil do cliente
              </span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setMode("guided")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                mode === "guided"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Orientado
              </span>
              <span className="text-xs text-muted-foreground">
                Você descreve como quer a mensagem e a IA gera
              </span>
            </button>
          </div>

          {mode === "guided" && (
            <div className="space-y-2">
              <Label htmlFor="ai-guidance">Como você quer a mensagem?</Label>
              <Textarea
                id="ai-guidance"
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                rows={4}
                disabled={loading}
                placeholder="Ex: tom informal, mencionar que temos frete grátis acima de R$200, focar nos itens da sacola e perguntar se precisa de ajuda para finalizar…"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void handleGenerate()}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
