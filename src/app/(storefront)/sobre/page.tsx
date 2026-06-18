import { CountUp } from "@/components/animations/count-up";
import { Parallax } from "@/components/animations/parallax";
import {
  ScrollReveal,
  Stagger,
  StaggerItem,
} from "@/components/animations/scroll-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  ArrowRight,
  Flame,
  Quote,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Sobre nós",
  description: `Conheça a história das Bordadeiras de Serra Pelada — um projeto social e cultural que transformou o território do garimpo em arte, renda e memória, ponto a ponto, pelas mãos de cerca de 80 artesãs.`,
  path: "/sobre",
});

type Stat = {
  to: number;
  prefix?: string;
  plain?: boolean;
  label: string;
};

const stats: Stat[] = [
  { to: 2023, plain: true, label: "Nasce a marca" },
  { to: 80, prefix: "~", label: "Artesãs no projeto" },
  { to: 3, label: "Pilares da marca" },
];

type Chapter = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

const chapters: Chapter[] = [
  {
    id: "origem",
    eyebrow: "A origem",
    title: "Do garimpo ao bordado",
    body: "A marca das Bordadeiras de Serra Pelada nasceu em 2023, a partir de um projeto social e cultural criado para valorizar as mulheres da comunidade e transformar a história de um território conhecido mundialmente pelo garimpo. Por meio de capacitações em bordado artesanal, dezenas de mulheres encontraram uma nova forma de gerar renda, fortalecer a autoestima e preservar a memória local.",
    image: "/sobre/JR_09824.jpg",
    alt: "Artesã bordando à mão em Serra Pelada",
  },
  {
    id: "trajetoria",
    eyebrow: "A trajetória",
    title: "Uma história que cresce",
    body: "Ao longo de sua trajetória, o grupo cresceu, ganhou reconhecimento regional e passou a representar a cultura e a identidade de Serra Pelada por meio de peças que retratam o cotidiano, as memórias do garimpo e a força das mulheres da comunidade. Hoje, cerca de 80 artesãs participam da iniciativa, levando suas obras para exposições, feiras e projetos culturais.",
    image: "/sobre/JR_09848.jpg",
    alt: "Grupo de artesãs de Serra Pelada reunidas",
  },
];

type Pilar = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const pilares: Pilar[] = [
  {
    icon: Flame,
    title: "Resiliência",
    text: "Transformamos a história de um território marcado pelo garimpo em arte feita à mão, ponto a ponto.",
  },
  {
    icon: Users,
    title: "Pertencimento",
    text: "Cada peça carrega o cotidiano, as memórias e a identidade de Serra Pelada.",
  },
  {
    icon: Sparkles,
    title: "Transformação",
    text: "O bordado gera renda, fortalece a autoestima e preserva a memória local.",
  },
];

const gallery = [
  "/sobre/JR_09811.jpg",
  "/sobre/JR_09816.jpg",
  "/sobre/JR_09820.jpg",
  "/sobre/JR_09833.jpg",
  "/sobre/JR_09834.jpg",
  "/sobre/JR_09842.jpg",
  "/sobre/JR_09843.jpg",
  "/sobre/JR_09851.jpg",
  "/sobre/JR_09853.jpg",
  "/sobre/JR_09856.jpg",
  "/sobre/JR_09861.jpg",
  "/sobre/JR_09863.jpg",
];

const galleryAspects = [
  "aspect-[4/3]",
  "aspect-[3/2]",
  "aspect-[5/4]",
  "aspect-[16/10]",
  "aspect-[4/3]",
];
export default function SobrePage() {
  return (
    <div>
      <section className="relative overflow-hidden gradient-mesh">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <ScrollReveal>
            <p className="label-caps text-[var(--color-cta)]">
              Nossa história · Desde 2023
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-tight text-[var(--color-brown)]">
              Bordadeiras de Serra Pelada
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Nascida em 2023 de um projeto social e cultural, a marca
              transformou o território mundialmente conhecido pelo garimpo em um
              celeiro de arte, memória e renda — bordado ponto a ponto pelas mãos
              das mulheres da comunidade.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild>
                <Link href="/loja">
                  Conhecer a loja
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="#historia"
                className="link-underline text-sm font-medium text-[var(--color-brown)]"
              >
                Ler nossa história
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--color-card-border)] shadow-2xl shadow-[var(--color-brown)]/20">
                <Image
                  src="/sobre/JR_09808.jpg"
                  alt="Artesã bordando uma peça"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brown)]/35 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-6 -left-4 w-28 overflow-hidden rounded-2xl border-4 border-[var(--color-bg)] shadow-xl sm:w-36 lg:-left-8">
                <div className="relative aspect-square">
                  <Image
                    src="/sobre/JR_09804.jpg"
                    alt="Detalhe de bordado artesanal"
                    fill
                    className="object-cover"
                    sizes="144px"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="absolute -right-3 -top-3 rounded-full bg-[var(--color-price)] px-4 py-2 text-center shadow-lg lg:-right-6 lg:-top-6">
                <span className="block font-display text-xl font-semibold leading-none text-white sm:text-2xl">
                  2023
                </span>
                <span className="mt-0.5 block text-[0.625rem] font-semibold uppercase tracking-wider text-white/90">
                  Fundada
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="section-home section-divider gradient-surface">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-cta)]/10 text-[var(--color-cta)]">
              <Quote className="h-6 w-6" />
            </span>
            <blockquote className="mt-6 font-serif text-[clamp(1.5rem,3.75vw,2.375rem)] italic leading-snug text-[var(--color-brown)]">
              “Mais do que uma marca, somos resiliência, pertencimento e
              transformação. Cada ponto bordado conta uma história de superação —
              e demonstra que, em um lugar marcado pela busca do ouro, também
              florescem arte, cultura e esperança.”
            </blockquote>
            <footer className="mt-6 font-body text-sm font-semibold uppercase tracking-wider text-[var(--color-brown-muted)]">
              — Bordadeiras de Serra Pelada
            </footer>
          </ScrollReveal>
        </div>
      </section>
      <section id="historia" className="section-home scroll-mt-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="section-header text-center">
            <p className="text-section-subtitle">Como tudo começou</p>
            <h2 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-brown)]">
              A história por trás de cada ponto
            </h2>
          </ScrollReveal>

          <div className="mt-12 flex flex-col gap-14 lg:gap-20">
            {chapters.map((chapter, idx) => (
              <ScrollReveal key={chapter.id}>
                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                  <div
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-3xl border border-[var(--color-card-border)] shadow-xl shadow-[var(--color-brown)]/10",
                      idx % 2 === 1 && "lg:order-2",
                    )}
                  >
                    <Parallax className="absolute inset-0" offset={28}>
                      <div className="relative h-[116%] w-full -translate-y-[8%]">
                        <Image
                          src={chapter.image}
                          alt={chapter.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width:1024px) 100vw, 50vw"
                          loading="lazy"
                        />
                      </div>
                    </Parallax>
                  </div>

                  <div className={cn(idx % 2 === 1 && "lg:order-1")}>
                    <p className="label-caps text-[var(--color-cta)]">
                      {chapter.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-[clamp(1.5rem,3.5vw,2.125rem)] font-semibold tracking-tight text-[var(--color-brown)]">
                      {chapter.title}
                    </h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--muted-foreground)]">
                      {chapter.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-14 lg:mt-20">
            <dl className="grid grid-cols-1 gap-6 rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-bg)] p-6 sm:grid-cols-3 sm:divide-x sm:divide-[var(--color-card-border)] sm:p-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:px-6">
                  <dt className="font-display text-[clamp(2.25rem,5vw,3rem)] font-semibold leading-none text-[var(--color-price)]">
                    {stat.plain ? (
                      stat.to
                    ) : (
                      <CountUp to={stat.to} prefix={stat.prefix} />
                    )}
                  </dt>
                  <dd className="mt-2 text-sm leading-snug text-[var(--muted-foreground)]">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </div>
      </section>
      <section className="section-home section-divider gradient-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="section-header text-center">
            <p className="text-section-subtitle">O que nos move</p>
            <h2 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-brown)]">
              Resiliência, pertencimento e transformação
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted-foreground)] sm:text-base">
              Os princípios que guiam cada peça e cada artesã de Serra Pelada.
            </p>
          </ScrollReveal>

          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {pilares.map((pilar) => (
              <StaggerItem key={pilar.title}>
                <div className="group h-full rounded-2xl border border-[var(--color-card-border)] bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--color-price)]/40 hover:shadow-lg hover:shadow-[var(--color-brown)]/10">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-price)]/15 text-[var(--color-price)] transition-transform duration-300 group-hover:scale-110">
                    <pilar.icon className="h-8 w-8" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[var(--color-brown)]">
                    {pilar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {pilar.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section-home section-divider bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="section-header text-center">
            <p className="text-section-subtitle">No ateliê</p>
            <h2 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-brown)]">
              O cotidiano bordado a cada ponto
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted-foreground)] sm:text-base">
              Um recorte do fazer artesanal das Bordadeiras de Serra Pelada —
              entre memórias do garimpo e a força das mulheres da comunidade.
            </p>
          </ScrollReveal>

          <div className="mt-12 columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4 [column-fill:_balance]">
            {gallery.map((src, i) => (
              <figure key={src} className="mb-3 break-inside-avoid sm:mb-4">
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-[var(--color-card-border)] shadow-sm",
                    galleryAspects[i % galleryAspects.length],
                  )}
                >
                  <Image
                    src={src}
                    alt={`Registro do ateliê das Bordadeiras de Serra Pelada ${i + 1}`}
                    fill
                    className="object-cover transition duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-brown)]/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/sobre/JR_09869.jpg"
            alt="Bordadeiras de Serra Pelada em seu ateliê"
            fill
            className="object-cover"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[var(--color-brown)]/85" />
          <div className="absolute inset-0 gradient-hero opacity-15" />
        </div>

        <ScrollReveal className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="font-serif text-lg italic text-[var(--color-price)]">
            Cada ponto, uma história
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-semibold leading-tight text-white">
            Onde se buscou ouro, florescem arte, cultura e esperança
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--color-bg)]/85">
            Conheça as peças criadas pelas cerca de 80 artesãs de Serra Pelada —
            bordados que carregam memória, pertencimento e transformação.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/loja">
              Ir para a loja
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </ScrollReveal>
      </section>
    </div>
  );
}