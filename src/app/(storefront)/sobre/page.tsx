import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Button } from "@/components/ui/button";
import { siteImages } from "@/lib/images";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { Award, HandHeart, Heart, Leaf, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Sobre nós",
  description: `Conheça a história da ${siteConfig.name}.`,
  path: "/sobre",
});

const values = [
  {
    icon: Heart,
    title: "Feito com amor",
    description:
      "Cada peça e cada atendimento carregam o cuidado de quem ama bordar.",
  },
  {
    icon: Award,
    title: "Qualidade comprovada",
    description:
      "Trabalhamos apenas com marcas e insumos testados e aprovados.",
  },
  {
    icon: Leaf,
    title: "Respeito ao artesanal",
    description:
      "Valorizamos a tradição do bordado feito à mão em cada detalhe.",
  },
];

const differentials = [
  { icon: Sparkles, title: "Curadoria especial", text: "Produtos selecionados para o seu ateliê." },
  { icon: HandHeart, title: "Suporte humano", text: "Atendimento próximo via WhatsApp." },
  { icon: Truck, title: "Entrega nacional", text: "Envio seguro e rastreado para todo o Brasil." },
];

export default function SobrePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
          <ScrollReveal>
            <p className="font-serif text-lg italic text-[var(--color-cta)]">
              Nossa história
            </p>
            <h1 className="mt-1 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight text-[var(--color-brown)]">
              Bordado é a nossa paixão
            </h1>
            <p className="mt-5 max-w-lg text-[var(--muted-foreground)]">
              A <strong className="text-[var(--color-brown)]">{siteConfig.legalName}</strong>{" "}
              nasceu da paixão pelo bordado e da vontade de oferecer
              equipamentos e insumos com qualidade comprovada e um atendimento
              acolhedor, próximo de cada cliente.
            </p>
            <Button className="mt-8" asChild>
              <Link href="/loja">Explorar a loja</Link>
            </Button>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-[var(--color-card-border)] shadow-2xl shadow-[var(--color-brown)]/15">
              <Image
                src={siteImages.sobreHero}
                alt="Artesã bordando"
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-[var(--color-brown)]">
              Nossos valores
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--muted-foreground)]">
              Os princípios que guiam cada ponto do nosso trabalho.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((value, i) => (
              <ScrollReveal key={value.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg)] p-7 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--color-cta)]">
                    <value.icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[var(--color-brown)]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {value.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-[var(--color-brown)]">
              Por que escolher a {siteConfig.name}
            </h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {differentials.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="flex items-start gap-4 rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-green)]/15 text-[var(--color-green)]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--color-brown)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {item.text}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-5xl">
          <div className="surface-dark relative overflow-hidden rounded-3xl bg-[var(--color-brown)] px-6 py-14 text-center sm:px-12">
            <div className="absolute inset-0 gradient-hero opacity-20" />
            <div className="relative">
              <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-white">
                Pronta para começar seu próximo bordado?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[var(--color-bg)]/80">
                Descubra máquinas, linhas e acessórios escolhidos a dedo para o
                seu ateliê.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="/loja">Ir para a loja</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
