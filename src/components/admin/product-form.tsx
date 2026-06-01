"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { productSchema } from "@/lib/validations/admin";
import { upsertProduct } from "@/actions/admin/products";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@prisma/client";

const formSchema = productSchema.extend({
  priceReais: z.string(),
  compareReais: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
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
      active: product?.active ?? true,
      categoryId: product?.categoryId ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
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
      active: values.active,
      categoryId: values.categoryId || null,
    };

    const res = await upsertProduct(payload, product?.id);
    if (res.success) {
      toast.success(product ? "Produto atualizado" : "Produto criado");
      router.push("/admin/produtos");
      router.refresh();
    } else {
      toast.error(res.error);
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("active")} />
        Produto ativo
      </label>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
