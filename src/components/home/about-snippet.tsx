import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function AboutSnippet() {
  return (
    <section className="py-20" data-gsap-fade>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <ScrollReveal>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1000&q=80"
              alt="Ateliê de bordado"
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Tradição e tecnologia no mesmo ateliê
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Há mais de uma década equipamos ateliês e indústrias com máquinas,
            insumos e suporte que aceleram a produção sem abrir mão da qualidade.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/sobre">Saiba mais sobre nós</Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
