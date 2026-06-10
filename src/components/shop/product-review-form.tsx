"use client";

import { submitProductReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadReviewImageViaApi } from "@/lib/upload-via-api";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  productId: string;
  isLoggedIn: boolean;
  canReview: boolean;
  loginCallbackUrl: string;
};

export function ProductReviewForm({
  productId,
  isLoggedIn,
  canReview,
  loginCallbackUrl,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-card-border)] bg-[var(--secondary)]/20 p-5 text-center">
        <p className="text-sm text-[var(--color-brown-muted)]">
          Faça login para avaliar este produto.
        </p>
        <Button asChild className="mt-3" variant="outline">
          <Link href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}>
            Entrar
          </Link>
        </Button>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/20 p-5">
        <p className="text-sm text-[var(--color-brown-muted)]">
          Somente clientes que compraram este produto podem deixar uma avaliação.
        </p>
      </div>
    );
  }

  function handleFileChange(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 10) {
      toast.error("Escreva pelo menos 10 caracteres na sua avaliação.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const url = await uploadReviewImageViaApi(imageFile);
        if (!url) {
          toast.error("Não foi possível enviar a foto.");
          return;
        }
        imageUrl = url;
      }

      const result = await submitProductReview({
        productId,
        rating,
        text: text.trim(),
        imageUrl: imageUrl || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Avaliação publicada!");
      setText("");
      setRating(5);
      handleFileChange(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--color-card-border)] bg-white p-5">
      <div>
        <Label className="text-[var(--color-brown)]">Sua nota</Label>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-0.5 transition hover:scale-110"
                aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "h-7 w-7",
                    value <= rating
                      ? "fill-[var(--color-price)] text-[var(--color-price)]"
                      : "fill-transparent text-[var(--color-card-border)]",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-text" className="text-[var(--color-brown)]">
          Seu comentário
        </Label>
        <Textarea
          id="review-text"
          rows={4}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Conte sua experiência com este produto..."
          className="resize-none"
        />
        <p className="text-xs text-[var(--muted-foreground)]">{text.length}/2000</p>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--color-brown)]">Foto (opcional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {imagePreview ? (
          <div className="relative inline-block">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--color-card-border)]">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => {
                handleFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
              aria-label="Remover foto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Adicionar foto
          </Button>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Publicar avaliação"
        )}
      </Button>
    </form>
  );
}
