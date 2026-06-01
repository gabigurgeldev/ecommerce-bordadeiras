import { ScrollReveal } from "@/components/animations/scroll-reveal";
import type { Category } from "@/lib/types/catalog";
import Image from "next/image";
import Link from "next/link";

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-20" data-gsap-fade>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Categorias
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Encontre máquinas, insumos e acessórios para seu fluxo de produção.
          </p>
        </ScrollReveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.id} delay={i * 0.08}>
              <Link
                href={`/loja/categoria/${cat.slug}`}
                className="group relative block aspect-[16/10] overflow-hidden rounded-2xl"
              >
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{cat.description}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
