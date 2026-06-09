"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  ImageIcon,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { ProductStatus, ShippingMode } from "@/lib/types/database";
import { productSchemaFields } from "@/lib/validations/admin";
import {
  deleteProduct,
  syncProductImages,
  syncProductOptions,
  syncProductVariants,
  upsertProduct,
} from "@/actions/admin/products";
import { productStatusLabels } from "@/components/admin/status-badge";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { AiImproveButton } from "@/components/admin/ai-improve-button";
import { ProductSectionCard } from "@/components/admin/product-form/section-card";
import {
  ProductVariantsEditor,
  optionsFromProduct,
  reaisToCentsOptional,
  variantsFromProduct,
  type VariantDraft,
  type VariantOptionDraft,
} from "@/components/admin/product-form/product-variants-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { slugify } from "@/lib/utils";
import { uploadImageViaApi } from "@/lib/upload-via-api";
import type { Category, ProductWithRelations } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const SEO_TITLE_MAX = 70;
const SEO_DESC_MAX = 160;

const videoUrlSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (v) => !v || /^https?:\/\/.+/i.test(v),
    "URL inválida",
  )
  .refine(
    (v) => !v || /youtube\.com|youtu\.be|vimeo\.com/i.test(v),
    "Use um link do YouTube ou Vimeo",
  );

const formSchema = productSchemaFields
  .extend({
    priceReais: z.string().min(1, "Informe o preço de venda"),
    compareReais: z.string().optional(),
    costReais: z.string().optional(),
    weightKg: z.string().optional(),
    fixedShippingReais: z.string().optional(),
    tagsInput: z.string().optional(),
    videoUrls: z.array(videoUrlSchema).default([]),
  })
  .omit({
    priceCents: true,
    compareCents: true,
    costCents: true,
    weightGrams: true,
    tags: true,
    fixedShippingCents: true,
  });

type FormValues = z.infer<typeof formSchema>;

type GalleryImage = {
  key: string;
  url: string;
  file?: File;
};

function centsToReais(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function reaisToCents(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function gramsToKg(grams: number | null | undefined): string {
  if (grams == null) return "";
  return (grams / 1000).toFixed(2);
}

function kgToGrams(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 1000);
}

function buildGalleryFromProduct(product?: ProductWithRelations): GalleryImage[] {
  if (!product?.productImages?.length) return [];
  return [...product.productImages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({ key: img.id, url: img.url }));
}

function buildDefaultValues(product?: ProductWithRelations): FormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    priceReais: product ? centsToReais(product.priceCents) : "",
    compareReais: product?.compareCents ? centsToReais(product.compareCents) : "",
    costReais: product?.costCents ? centsToReais(product.costCents) : "",
    stock: product?.stock ?? 0,
    status: product?.status ?? ProductStatus.DRAFT,
    categoryId: product?.categoryId ?? "",
    seoTitle: product?.seoTitle ?? "",
    seoDescription: product?.seoDescription ?? "",
    tagsInput: product?.tags?.join(", ") ?? "",
    brand: product?.brand ?? "",
    showPrice: product?.showPrice ?? true,
    stockUnlimited: product?.stockUnlimited ?? false,
    weightKg: gramsToKg(product?.weightGrams),
    lengthCm: product?.lengthCm ?? undefined,
    widthCm: product?.widthCm ?? undefined,
    heightCm: product?.heightCm ?? undefined,
    shippingMode: product?.shippingMode ?? ShippingMode.CORREIOS,
    fixedShippingReais: product?.fixedShippingCents
      ? centsToReais(product.fixedShippingCents)
      : "",
    videoUrls: product?.videoUrls ?? (product?.videoUrl ? [product.videoUrl] : []),
  };
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "0,00",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

function UnitInput({
  id,
  value,
  onChange,
  unit,
  type = "text",
}: {
  id: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  unit: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

export function ProductFormPage({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithRelations;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [videoOpen, setVideoOpen] = useState(Boolean(product?.videoUrl));
  const [dragOver, setDragOver] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>(() => buildGalleryFromProduct(product));
  const [variantOptions, setVariantOptions] = useState<VariantOptionDraft[]>(() =>
    optionsFromProduct(
      product?.productOptions?.map((o) => ({
        name: o.name,
        sortOrder: o.sortOrder,
        values: (o.values ?? []).map((v) => ({ value: v.value, sortOrder: v.sortOrder })),
      })),
    ),
  );
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    variantsFromProduct(
      product?.productVariants?.map((v) => ({
        ...v,
        attributes: (v.attributes ?? {}) as Record<string, unknown>,
      })),
      centsToReais,
    ),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(product),
  });

  const values = form.watch();
  const categoryName = categories.find((c) => c.id === values.categoryId)?.name ?? "";

  const marginLabel = useMemo(() => {
    const price = reaisToCents(values.priceReais || "0");
    const cost = values.costReais ? reaisToCents(values.costReais) : null;
    if (!price || cost == null) return "—";
    const margin = ((price - cost) / price) * 100;
    return `${margin.toFixed(1)}%`;
  }, [values.priceReais, values.costReais]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const next: GalleryImage[] = [];
    for (const file of Array.from(files)) {
      next.push({
        key: `pending-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        file,
      });
    }
    setGallery((prev) => [...prev, ...next]);
  }, []);

  const removeImage = useCallback((key: string) => {
    setGallery((prev) => {
      const item = prev.find((img) => img.key === key);
      if (item?.file) URL.revokeObjectURL(item.url);
      return prev.filter((img) => img.key !== key);
    });
  }, []);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const saveProduct = async (statusOverride?: ProductStatus) => {
    const slug = values.slug?.trim() || slugify(values.name);
    if (!values.slug?.trim()) {
      form.setValue("slug", slug, { shouldValidate: true });
    }

    const valid = await form.trigger();
    if (!valid) {
      toast.error("Revise os campos destacados");
      return;
    }

    setSaving(true);
    try {
      const tags = (values.tagsInput ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: values.name,
        slug,
        description: values.description,
        sku: variants.length ? null : values.sku || null,
        priceCents: reaisToCents(values.priceReais),
        compareCents: values.compareReais ? reaisToCents(values.compareReais) : null,
        costCents: values.costReais ? reaisToCents(values.costReais) : null,
        stock: values.stockUnlimited ? 0 : values.stock,
        status: statusOverride ?? values.status,
        categoryId: values.categoryId || null,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        tags,
        brand: values.brand || null,
        showPrice: values.showPrice,
        stockUnlimited: values.stockUnlimited,
        weightGrams: kgToGrams(values.weightKg ?? ""),
        lengthCm: values.lengthCm ?? null,
        widthCm: values.widthCm ?? null,
        heightCm: values.heightCm ?? null,
        shippingMode: values.shippingMode,
        fixedShippingCents:
          values.shippingMode === ShippingMode.FIXED && values.fixedShippingReais
            ? reaisToCents(values.fixedShippingReais)
            : null,
        videoUrls: (values.videoUrls ?? []).filter(
          (url): url is string => typeof url === "string" && url.trim() !== "",
        ),
      };

      const res = await upsertProduct(payload, product?.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }

      const productId = res.data!.id;
      const imagePayload: { url: string; alt: null; sortOrder: number; isPrimary: boolean }[] = [];

      for (let i = 0; i < gallery.length; i++) {
        const item = gallery[i];
        if (item.file) {
          const url = await uploadImageViaApi(item.file, "product", productId);
          if (!url) {
            toast.error(`Falha no upload da imagem ${i + 1}`);
            return;
          }
          imagePayload.push({ url, alt: null, sortOrder: i, isPrimary: i === 0 });
        } else {
          imagePayload.push({ url: item.url, alt: null, sortOrder: i, isPrimary: i === 0 });
        }
      }

      const syncImg = await syncProductImages(productId, imagePayload);
      if (!syncImg.success) {
        toast.error(syncImg.error);
        return;
      }

      const optionsPayload = variantOptions
        .filter((o) => o.name.trim() && o.values.length)
        .map((o, i) => ({
          name: o.name.trim(),
          sortOrder: i,
          values: o.values.map((v, vi) => ({ value: v, sortOrder: vi })),
        }));

      const syncOpt = await syncProductOptions(productId, optionsPayload);
      if (!syncOpt.success) {
        toast.error(syncOpt.error);
        return;
      }

      const variantsPayload = variants.map((v, i) => ({
        sku: v.sku || null,
        priceCents: reaisToCentsOptional(v.priceReais),
        compareCents: reaisToCentsOptional(v.compareReais),
        stock: v.stockUnlimited ? 0 : v.stock,
        stockUnlimited: v.stockUnlimited,
        attributes: v.attributes,
        imageUrl: v.imageUrl || null,
        sortOrder: i,
        active: v.active,
      }));

      const syncVar = await syncProductVariants(productId, variantsPayload);
      if (!syncVar.success) {
        toast.error(syncVar.error);
        return;
      }

      toast.success(isEdit ? "Produto atualizado" : "Produto salvo");
      router.push(`/admin/produtos/${productId}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
        <AdminPageContainer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="ghost" size="icon" asChild>
              <Link href="/admin/produtos" aria-label="Voltar">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold sm:text-xl">
                {isEdit ? "Editar produto" : "Novo produto"}
              </h1>
              {isEdit ? (
                <p className="truncate text-xs text-muted-foreground">{product?.name}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEdit ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Excluir
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void saveProduct(ProductStatus.DRAFT)}
            >
              Salvar rascunho
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void saveProduct(ProductStatus.ACTIVE)}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Publicar
            </Button>
          </div>
        </AdminPageContainer>
      </div>

      <AdminPageContainer className="space-y-6 px-4 py-6 sm:px-6">
        <ProductSectionCard title="Nome e descrição">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Nome</Label>
              <Input id="pf-name" {...form.register("name")} placeholder="Ex.: Kit bordado floral" />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-slug">Endereço na loja (slug)</Label>
              <Input id="pf-slug" {...form.register("slug")} placeholder="kit-bordado-floral" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Descrição</Label>
                <AiImproveButton
                  context="product"
                  scope="description"
                  label="Gerar com IA"
                  input={{ name: values.name, description: values.description ?? "" }}
                  disabled={!values.name?.trim()}
                  onImprove={(fields) => {
                    if (fields.description) {
                      form.setValue("description", fields.description, { shouldValidate: true });
                    }
                  }}
                />
              </div>
              <RichTextEditor
                value={values.description ?? ""}
                onChange={(html) => form.setValue("description", html, { shouldValidate: true })}
              />
            </div>
          </div>
        </ProductSectionCard>

        <ProductSectionCard
          title="Fotos e vídeos"
          description="Adicione fotos de alta qualidade e vídeos do seu produto."
        >
          {/* Image Guidelines Card */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">Diretrizes para imagens</h4>
                <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-amber-200/50 px-1.5 py-0.5 font-medium dark:bg-amber-900/40">Tamanho e proporção ideais</span>
                    <span>1000x1000px ou superior (Proporção 1:1 Quadrada)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-amber-200/50 px-1.5 py-0.5 font-medium dark:bg-amber-900/40">Tamanho máximo</span>
                    <span>2MB por arquivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-amber-200/50 px-1.5 py-0.5 font-medium dark:bg-amber-900/40">Formatos aceitos</span>
                    <span>WEBP (recomendado), PNG ou JPEG</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-amber-200/50 px-1.5 py-0.5 font-medium dark:bg-amber-900/40">Recomendação</span>
                    <span>Use fundo branco ou transparente para um melhor visual na loja</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-primary/40 bg-primary/[0.02]",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <ImagePlus className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm font-medium text-primary">
              Arraste e solte, ou selecione fotos do produto
            </p>
            <label className="mt-3 inline-flex cursor-pointer">
              <span className="sr-only">Selecionar imagens</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Selecionar arquivos</span>
              </Button>
            </label>
          </div>

          {gallery.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {gallery.map((img, index) => (
                <li key={img.key} className="relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border sm:h-28 sm:w-28">
                    <Image
                      src={img.url}
                      alt={`Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={
                        img.url.startsWith("blob:") || img.url.startsWith("http://localhost")
                      }
                    />
                  </div>
                  {index === 0 ? (
                    <span className="absolute -bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                      Capa
                    </span>
                  ) : null}
                  <div className="absolute -right-1 -top-1 flex gap-0.5">
                    {index > 0 ? (
                      <button
                        type="button"
                        className="rounded bg-background px-1 text-[10px] shadow border"
                        onClick={() => moveImage(index, -1)}
                      >
                        ←
                      </button>
                    ) : null}
                    {index < gallery.length - 1 ? (
                      <button
                        type="button"
                        className="rounded bg-background px-1 text-[10px] shadow border"
                        onClick={() => moveImage(index, 1)}
                      >
                        →
                      </button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeImage(img.key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              Nenhuma imagem adicionada.
            </p>
          )}

          {/* Video URLs Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Vídeos do produto</h4>
              <span className="text-xs text-muted-foreground">YouTube ou Vimeo</span>
            </div>
            
            {form.watch("videoUrls")?.map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    {...form.register(`videoUrls.${index}`)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {form.formState.errors.videoUrls?.[index] && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.videoUrls[index]?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const current = form.getValues("videoUrls") || [];
                    form.setValue(
                      "videoUrls",
                      current.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues("videoUrls") || [];
                form.setValue("videoUrls", [...current, ""]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar vídeo
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Dica: Você pode adicionar múltiplos vídeos do YouTube ou Vimeo para mostrar diferentes ângulos ou demonstrações do produto.
            </p>
          </div>
        </ProductSectionCard>

        <ProductSectionCard title="Preços">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Preço de venda</Label>
              <MoneyInput
                id="pf-price"
                value={values.priceReais}
                onChange={(v) => form.setValue("priceReais", v, { shouldValidate: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-compare">Preço promocional</Label>
              <MoneyInput
                id="pf-compare"
                value={values.compareReais ?? ""}
                onChange={(v) => form.setValue("compareReais", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-cost">Custo</Label>
              <MoneyInput
                id="pf-cost"
                value={values.costReais ?? ""}
                onChange={(v) => form.setValue("costReais", v)}
              />
              <p className="text-xs text-muted-foreground">
                Uso interno — seus clientes não verão na loja.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Margem de lucro</Label>
              <Input value={marginLabel} readOnly className="bg-muted/50" />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("showPrice")} />
            Exibir o preço na loja
          </label>
        </ProductSectionCard>

        <ProductSectionCard title="Inventário">
          <div className="space-y-3">
            <Label>Estoque</Label>
            <div className="space-y-2 rounded-lg border divide-y">
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <input
                  type="radio"
                  checked={values.stockUnlimited}
                  onChange={() => form.setValue("stockUnlimited", true)}
                />
                <span className="text-sm font-medium">Infinito</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <input
                  type="radio"
                  checked={!values.stockUnlimited}
                  onChange={() => form.setValue("stockUnlimited", false)}
                />
                <span className="text-sm font-medium">Limitado</span>
              </label>
            </div>
            {!values.stockUnlimited && variants.length === 0 ? (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="pf-stock">Quantidade</Label>
                <Input
                  id="pf-stock"
                  type="number"
                  min={0}
                  {...form.register("stock", { valueAsNumber: true })}
                />
              </div>
            ) : null}
            {variants.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Este produto usa variações — o estoque é gerenciado por combinação abaixo.
              </p>
            ) : null}
          </div>
        </ProductSectionCard>

        <ProductSectionCard
          title="Peso e dimensões"
          description="Preencha para calcular frete e exibir meios de envio na loja."
          action={
            <AiImproveButton
              context="product"
              scope="dimensions"
              label="Gerar com IA"
              input={{
                name: values.name,
                description: values.description?.replace(/<[^>]+>/g, " ").slice(0, 500) ?? "",
                category: categoryName,
              }}
              disabled={!values.name?.trim()}
              onImprove={(fields) => {
                if (fields.weightGrams) {
                  form.setValue("weightKg", (Number(fields.weightGrams) / 1000).toFixed(2));
                }
                if (fields.lengthCm) form.setValue("lengthCm", Number(fields.lengthCm));
                if (fields.widthCm) form.setValue("widthCm", Number(fields.widthCm));
                if (fields.heightCm) form.setValue("heightCm", Number(fields.heightCm));
              }}
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-weight">Peso</Label>
              <UnitInput
                id="pf-weight"
                value={values.weightKg}
                onChange={(v) => form.setValue("weightKg", v)}
                unit="kg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-length">Comprimento</Label>
              <UnitInput
                id="pf-length"
                type="number"
                value={values.lengthCm ?? ""}
                onChange={(v) => form.setValue("lengthCm", v ? Number(v) : undefined)}
                unit="cm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-width">Largura</Label>
              <UnitInput
                id="pf-width"
                type="number"
                value={values.widthCm ?? ""}
                onChange={(v) => form.setValue("widthCm", v ? Number(v) : undefined)}
                unit="cm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-height">Altura</Label>
              <UnitInput
                id="pf-height"
                type="number"
                value={values.heightCm ?? ""}
                onChange={(v) => form.setValue("heightCm", v ? Number(v) : undefined)}
                unit="cm"
              />
            </div>
          </div>
        </ProductSectionCard>

        <ProductSectionCard
          title="Frete"
          description="Define como o frete deste produto será calculado no checkout."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modo de frete</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    {
                      value: ShippingMode.FREE,
                      label: "Grátis",
                      hint: "Frete sempre gratuito para este produto.",
                    },
                    {
                      value: ShippingMode.FIXED,
                      label: "Valor fixo",
                      hint: "Cobra um valor único de frete, independente do CEP.",
                    },
                    {
                      value: ShippingMode.CORREIOS,
                      label: "Calculado via Melhor Envio",
                      hint: "Usa peso, dimensões e CEPs para consultar tarifas.",
                    },
                  ] as const
                ).map(({ value, label, hint }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-all",
                      values.shippingMode === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        className="sr-only"
                        checked={values.shippingMode === value}
                        onChange={() => form.setValue("shippingMode", value, { shouldValidate: true })}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{hint}</span>
                  </label>
                ))}
              </div>
            </div>

            {values.shippingMode === ShippingMode.FIXED ? (
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="pf-fixed-shipping">Valor fixo de frete</Label>
                <MoneyInput
                  id="pf-fixed-shipping"
                  value={values.fixedShippingReais ?? ""}
                  onChange={(v) => form.setValue("fixedShippingReais", v, { shouldValidate: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Este valor será somado ao pedido quando o produto estiver no carrinho.
                </p>
              </div>
            ) : null}

            {values.shippingMode === ShippingMode.CORREIOS &&
            (!values.weightKg?.trim() ||
              !values.lengthCm ||
              !values.widthCm ||
              !values.heightCm) ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Para calcular frete via Melhor Envio, preencha peso e dimensões na seção acima.
                  Sem esses dados, o cálculo de frete pode falhar no checkout e na página do produto.
                </p>
              </div>
            ) : null}
          </div>
        </ProductSectionCard>

        <ProductSectionCard title="Variações">
          <ProductVariantsEditor
            options={variantOptions}
            variants={variants}
            onOptionsChange={setVariantOptions}
            onVariantsChange={setVariants}
          />
        </ProductSectionCard>

        <ProductSectionCard
          title="SEO e busca na loja"
          action={
            <AiImproveButton
              context="product"
              scope="seo"
              label="Gerar tudo com IA"
              input={{
                name: values.name,
                description: values.description?.replace(/<[^>]+>/g, " ").slice(0, 500) ?? "",
                brand: values.brand ?? "",
                tags: values.tagsInput ?? "",
                seoTitle: values.seoTitle ?? "",
                seoDescription: values.seoDescription ?? "",
              }}
              disabled={!values.name?.trim()}
              onImprove={(fields) => {
                if (fields.tags) form.setValue("tagsInput", fields.tags);
                if (fields.brand) form.setValue("brand", fields.brand);
                if (fields.seoTitle) form.setValue("seoTitle", fields.seoTitle);
                if (fields.seoDescription) form.setValue("seoDescription", fields.seoDescription);
              }}
            />
          }
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-tags">Tags</Label>
              <p className="text-xs text-muted-foreground">
                Palavras-chave separadas por vírgula para ajudar na busca da loja.
              </p>
              <Input id="pf-tags" {...form.register("tagsInput")} placeholder="bordado, kit, floral" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-brand">Marca</Label>
              <Input id="pf-brand" {...form.register("brand")} placeholder="Ex.: Bordadeiras" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-seo-title">Título SEO</Label>
              <Input id="pf-seo-title" maxLength={SEO_TITLE_MAX} {...form.register("seoTitle")} />
              <p className="text-xs text-muted-foreground">
                {(values.seoTitle?.length ?? 0)}/{SEO_TITLE_MAX} caracteres
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-seo-desc">Descrição SEO</Label>
              <Textarea
                id="pf-seo-desc"
                rows={3}
                maxLength={SEO_DESC_MAX}
                {...form.register("seoDescription")}
              />
              <p className="text-xs text-muted-foreground">
                {(values.seoDescription?.length ?? 0)}/{SEO_DESC_MAX} caracteres
              </p>
            </div>
          </div>
        </ProductSectionCard>

        <ProductSectionCard title="Organização e publicação">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-category">Categoria</Label>
              <select
                id="pf-category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                {...form.register("categoryId")}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-status">Status</Label>
              <select
                id="pf-status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                {...form.register("status")}
              >
                <option value={ProductStatus.DRAFT}>{productStatusLabels.DRAFT}</option>
                <option value={ProductStatus.ACTIVE}>{productStatusLabels.ACTIVE}</option>
                <option value={ProductStatus.OUT_OF_STOCK}>{productStatusLabels.OUT_OF_STOCK}</option>
                <option value={ProductStatus.ARCHIVED}>{productStatusLabels.ARCHIVED}</option>
              </select>
            </div>
            {variants.length === 0 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pf-sku">SKU</Label>
                <Input id="pf-sku" {...form.register("sku")} placeholder="Opcional" />
              </div>
            ) : null}
          </div>
        </ProductSectionCard>
      </AdminPageContainer>

      {product ? (
        <AdminConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir produto?"
          description={`O produto "${product.name}" será removido permanentemente.`}
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            const res = await deleteProduct(product.id);
            if (res.success) {
              toast.success("Produto excluído");
              router.push("/admin/produtos");
            } else {
              toast.error(res.error);
            }
          }}
        />
      ) : null}
    </div>
  );
}
