import { CountUp } from "@/components/animations/count-up";
import { Parallax } from "@/components/animations/parallax";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Button } from "@/components/ui/button";
import { siteImages } from "@/lib/images";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const stats: {
  to: number;
  prefix?: string;
  suffix?: string;
  label: string;
}[] = [
  { to: 10, prefix: "+", label: "anos de ateliê" },
  { to: 5000, prefix: "+", label: "ateliês atendidos" },
  { to: 98, suffix: "%", label: "clientes satisfeitos" },
];

export function AboutSnippet() {
  return (
    <section className="section-home section-divider gradient-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <ScrollReveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--color-card-border)] shadow-lg shadow-[var(--color-brown)]/8 lg:aspect-[3/2]">
            <Parallax className="absolute inset-0" offset={36}>
              <div className="relative h-[118%] w-full -translate-y-[9%]">
                <Image
                  src={siteImages.about}
                  alt="Ateliê de bordado"
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 50vw"
                  loading="lazy"
                />
              </div>
            </Parallax>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.08}>
          <p className="text-section-subtitle">Nossa essência</p>
          <h2 className="mt-1 font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-tight text-[var(--color-brown)]">
            Tradição e cuidado em cada ponto
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--muted-foreground)] sm:text-base">
            Há mais de uma década equipamos ateliês e bordadeiras com máquinas,
            insumos e suporte que aceleram a produção sem abrir mão da
            delicadeza do trabalho feito à mão.
          </p>

          <dl className="mt-7 grid max-w-lg grid-cols-3 gap-2.5 sm:gap-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--color-card-border)] bg-white/70 p-3 text-center sm:p-4"
              >
                <dt className="font-display text-xl font-semibold text-[var(--color-price)] sm:text-3xl">
                  <CountUp
                    to={stat.to}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </dt>
                <dd className="mt-1 text-xs leading-snug text-[var(--muted-foreground)] sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button className="group min-h-[44px]" asChild>
              <Link href="/sobre">
                Saiba mais sobre nós
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Link
              href="/contato"
              className="link-underline text-sm font-medium text-[var(--color-brown)]"
            >
              Fale com o ateliê
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
