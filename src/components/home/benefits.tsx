"use client";

import { ScrollReveal, Stagger, StaggerItem } from "@/components/animations/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { ArrowRight, PackageCheck, RotateCcw, Wrench } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: PackageCheck,
    title: "Entrega com rastreio",
    description:
      "Envio nacional com acompanhamento do pedido até a sua porta.",
    href: "/contato",
  },
  {
    icon: Wrench,
    title: "Assistência técnica",
    description:
      "Suporte especializado em máquinas e equipamentos que você compra aqui.",
    href: "/contato",
  },
  {
    icon: RotateCcw,
    title: "Troca facilitada",
    description:
      "Política clara de troca e devolução — fale com a gente pelo WhatsApp.",
    href: "/contato",
  },
];

export function Benefits() {
  return (
    <section className="section-home section-divider bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            subtitle="Por que comprar com a gente"
            title="Compra tranquila, do início ao fim"
            description="Cuidamos de cada etapa para que você foque no que importa: bordar."
          />
        </ScrollReveal>

        <Stagger className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <Link
                href={b.href}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--color-price)]/40 hover:shadow-lg hover:shadow-[var(--color-brown)]/10 sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--color-brown)] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[var(--color-price)]/15">
                  <b.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-[var(--color-brown)] sm:text-lg">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {b.description}
                  </p>
                </div>
                <span className="link-underline text-xs font-semibold tracking-wide text-[var(--color-brown-muted)] transition-colors group-hover:text-[var(--color-brown)]">
                  Saiba mais
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
