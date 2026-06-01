"use client";

import { formatCurrency, formatInstallment } from "@/lib/format";
import type { Product } from "@/lib/types/catalog";
import { useCartStore } from "@/store/cart";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <motion.article
      layout
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      whileHover={{ y: -4 }}
    >
      <Link href={`/produto/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw"
          loading="lazy"
        />
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Destaque
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/produto/${product.slug}`}>
          <h3 className="font-medium text-zinc-900 line-clamp-2 dark:text-white">
            {product.name}
          </h3>
        </Link>
        <p className="text-lg font-semibold text-rose-600">
          {formatCurrency(product.priceCents)}
        </p>
        <p className="text-xs text-zinc-500">
          {formatInstallment(product.priceCents)}
        </p>
        <div className="mt-auto flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                imageUrl: product.images[0]!,
              })
            }
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/produto/${product.slug}`}>Ver</Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
