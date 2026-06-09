"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { improveWithAi } from "@/actions/admin/ai";
import { Button } from "@/components/ui/button";
import type { AiImproveContext, AiImproveScope } from "@/lib/validations/ai";

type AiImproveButtonProps = {
  context: AiImproveContext;
  scope: AiImproveScope;
  input: Record<string, string>;
  onImprove: (fields: Record<string, string>) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function AiImproveButton({
  context,
  scope,
  input,
  onImprove,
  disabled,
  label = "Melhorar com IA",
  className,
}: AiImproveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await improveWithAi(context, scope, input);
      if (res.success && res.data) {
        onImprove(res.data);
        toast.success("Texto melhorado — revise antes de salvar");
      } else if (!res.success) {
        toast.error(res.error ?? "Falha ao melhorar com IA");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled || loading}
      onClick={() => void handleClick()}
    >
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </Button>
  );
}
