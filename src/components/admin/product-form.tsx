"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { ProductStatus } from "@/lib/types/database";
import { productSchema } from "@/lib/validations/admin";
import { syncProductImages, upsertProduct } from "@/actions/admin/products";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product, ProductImage } from "@/lib/types/database";
import { ImagePlus, X } from "lucide-react";
import { uploadImageViaApi } from "@/lib/upload-via-api";

const formSchema = productSchema.extend({
  priceReais: z.string(),
  compareReais: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ProductWithImages = Product & { productImages: ProductImage[] };

type GalleryImage = {
  key: string;
  url: string;
  file?: File;
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
  OUT_OF_STOCK: "Sem estoque",
};

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductWithImages;
  categories: Category[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>(() =>
    (product?.productImages ?? []).map((img) => ({
      key: img.id,
      url: img.url,
    })),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      priceReais: product ? (product.priceCents / 100).toFixed(2) : "",
      compareReais: product?.compareCents ? (product.compareCents / 100).toFixed(2) : "",
      stock: product?.stock ?? 0,
      status: product?.status ?? ProductStatus.DRAFT,
      categoryId: product?.categoryId ?? "",
    },
  });

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

  const onSubmit = form.handleSubmit(async (values) => {
    setUploading(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug || slugify(values.name),
        description: values.description,
        sku: values.sku,
        priceCents: Math.round(parseFloat(values.priceReais.replace(",", ".")) * 100),
        compareCents: values.compareReais
          ? Math.round(parseFloat(values.compareReais.replace(",", ".")) * 100)
          : null,
        stock: values.stock,
        status: values.status,
        categoryId: values.categoryId || null,
      };

      const res = await upsertProduct(payload, product?.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }

      const productId = res.data!.id;
      const imagePayload: { url: string; alt: null; sortOrder: number; isPrimary: boolean }[] =
        [];

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

      const syncRes = await syncProductImages(productId, imagePayload);
      if (!syncRes.success) {
        toast.error(syncRes.error);
        return;
      }

      toast.success(product ? "Produto atualizado" : "Produto criado");
      router.push("/admin/produtos");
      router.refresh();
    } finally {
      setUploading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...form.register("slug")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...form.register("sku")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priceReais">Preço (R$)</Label>
          <Input id="priceReais" {...form.register("priceReais")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compareReais">Preço comparativo (R$)</Label>
          <Input id="compareReais" {...form.register("compareReais")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock">Estoque</Label>
        <Input id="stock" type="number" {...form.register("stock", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...form.register("status")}
        >
          <option value={ProductStatus.DRAFT}>{STATUS_LABELS.DRAFT}</option>
          <option value={ProductStatus.ACTIVE}>{STATUS_LABELS.ACTIVE}</option>
          <option value={ProductStatus.ARCHIVED}>{STATUS_LABELS.ARCHIVED}</option>
          <option value={ProductStatus.OUT_OF_STOCK}>{STATUS_LABELS.OUT_OF_STOCK}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select
          id="categoryId"
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
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={5} {...form.register("description")} />
      </div>

      <div className="space-y-2">
        <Label>Imagens</Label>
        {gallery.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {gallery.map((img, index) => (
              <li key={img.key} className="relative">
                <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                  <Image
                    src={img.url}
                    alt={`Imagem ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={img.url.startsWith("blob:") || img.url.startsWith("http://localhost")}
                  />
                </div>
                {index === 0 ? (
                  <span className="absolute -bottom-1 left-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">
                    Capa
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={() => removeImage(img.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma imagem adicionada.</p>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted/50">
          <ImagePlus className="h-4 w-4" />
          Adicionar imagens
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <Button type="submit" disabled={uploading}>
        {uploading ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
