"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatCurrency, formatInstallment } from "@/lib/format";
import type { Product } from "@/lib/types/catalog";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function ProductCardContent({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const isNew = product.tags?.includes("novo");

  return (
    <>
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[var(--secondary)]"
      >
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          loading={index < 4 ? "eager" : "lazy"}
          priority={index < 2}
        />
        {isNew ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-green)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Novo
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Link href={`/produto/${product.slug}`} className="block min-h-[2.5rem]">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-[var(--color-brown)] sm:text-base">
            {product.name}
          </h3>
        </Link>
        <div>
          <p className="text-lg font-bold tracking-tight text-[var(--color-price)] sm:text-xl">
            {formatCurrency(product.priceCents)}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] sm:text-xs">
            {formatInstallment(product.priceCents)}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <AddToCartButton
            size="sm"
            className="h-10 w-full min-h-[44px] shadow-sm"
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.images[0]!,
            }}
          />
          <Link
            href={`/produto/${product.slug}`}
            className="link-muted inline-flex min-h-[44px] items-center justify-center gap-1 text-xs font-medium underline-offset-4 hover:underline sm:text-sm"
          >
            Ver detalhes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

const cardClassName =
  "group card-shine flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-brown)]/10 motion-reduce:hover:translate-y-0";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <article className={cardClassName}>
        <ProductCardContent product={product} index={index} />
      </article>
    );
  }

  return (
    <motion.article
      className={cardClassName}
      initial={{ opacity: 1, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: 0.4,
        delay: (index % 8) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <ProductCardContent product={product} index={index} />
    </motion.article>
  );
}
