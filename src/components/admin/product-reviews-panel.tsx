"use client";

import {
  deleteProductReview,
  generateProductReviewsWithAi,
  listProductReviews,
} from "@/actions/admin/product-reviews";
import { ProductSectionCard } from "@/components/admin/product-form/section-card";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewSource, type ProductReview } from "@/lib/types/database";
import { Loader2, Sparkles, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SOURCE_LABELS: Record<ReviewSource, string> = {
  USER: "Cliente",
  AI: "IA",
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function ProductReviewsPanel({
  productId,
  productName,
  categoryName,
  descriptionPlain,
}: {
  productId: string;
  productName: string;
  categoryName: string;
  descriptionPlain: string;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState("5");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProductReviews(productId);
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function handleGenerate() {
    const n = parseInt(count, 10);
    if (Number.isNaN(n) || n < 1 || n > 20) {
      toast.error("Informe uma quantidade entre 1 e 20");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateProductReviewsWithAi(productId, n);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data?.created ?? 0} avaliações geradas com IA`);
      await loadReviews();
      router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ProductSectionCard title="Avaliações">
      <div className="space-y-6">
        <div className="rounded-lg border border-dashed border-input bg-muted/20 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-review-count">Gerar avaliações com IA</Label>
              <Input
                id="ai-review-count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-24"
              />
            </div>
            <Button type="button" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar com IA
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Gera comentários fictícios plausíveis para &ldquo;{productName}&rdquo;
            {categoryName ? ` (${categoryName})` : ""}. Requer OpenRouter configurado.
          </p>
          {descriptionPlain ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              Contexto: {descriptionPlain.slice(0, 160)}
              {descriptionPlain.length > 160 ? "…" : ""}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando avaliações...
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação para este produto.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Autor</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                  <th className="px-3 py-2 font-medium">Comentário</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b last:border-0">
                    <td className="px-3 py-2 align-top">{review.authorName}</td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {review.rating}
                      </span>
                    </td>
                    <td className="max-w-xs px-3 py-2 align-top">
                      <p className="line-clamp-3">{review.text}</p>
                    </td>
                    <td className="px-3 py-2 align-top">{SOURCE_LABELS[review.source]}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(review.id)}
                        aria-label="Excluir avaliação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir avaliação?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const result = await deleteProductReview(deleteId);
          if (result.success) {
            toast.success("Avaliação excluída");
            setDeleteId(null);
            await loadReviews();
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />
    </ProductSectionCard>
  );
}
