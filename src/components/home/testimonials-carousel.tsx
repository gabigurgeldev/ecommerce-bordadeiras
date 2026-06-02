"use client";

import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  productPurchased?: string;
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function getProductLabel(t: Testimonial): string | undefined {
  if (t.productPurchased?.trim()) return t.productPurchased.trim();

  const patterns = [
    /\b(Pro\s+X\d+)\b/i,
    /\b(Home\s+\d+)\b/i,
    /\b(compacta\s+Home\s+\d+)\b/i,
    /\b(linhas?\s+de\s+bordado)\b/i,
  ];

  for (const pattern of patterns) {
    const match = t.text.match(pattern);
    if (match?.[1]) {
      const raw = match[1];
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  }

  return undefined;
}

function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  const product = getProductLabel(t);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-brown)]/10 sm:p-6">
      <span
        className="pointer-events-none absolute -top-2 right-3 font-display text-[6rem] leading-none text-[var(--color-price)]/15 transition-colors duration-300 group-hover:text-[var(--color-price)]/25"
        aria-hidden
      >
        &rdquo;
      </span>
      <div className="flex gap-0.5" aria-label={`${t.rating} de 5 estrelas`}>
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-[var(--color-price)] text-[var(--color-price)] sm:h-5 sm:w-5"
            aria-hidden
          />
        ))}
      </div>

      <blockquote className="relative mt-4 flex-1">
        <p className="font-serif text-base leading-relaxed italic text-[var(--color-brown)] sm:text-lg">
          &ldquo;{t.text}&rdquo;
        </p>
      </blockquote>

      <footer className="mt-5 flex items-center gap-3 border-t border-[var(--color-card-border)] pt-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] font-display text-lg font-semibold text-[var(--color-brown)]"
          aria-hidden
        >
          {getInitial(t.name)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-[var(--color-brown)]">
            {t.name}
          </p>
          {product ? (
            <p className="mt-0.5 text-xs font-medium text-[var(--color-price)] sm:text-sm">
              Comprou: {product}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:text-sm">
            {t.role}
          </p>
        </div>
      </footer>
    </article>
  );
}

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const reduceMotion = useReducedMotion();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: testimonials.length > 1, align: "start" },
    testimonials.length > 1 && !reduceMotion
      ? [Autoplay({ delay: 6000, stopOnInteraction: true })]
      : [],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="section-home section-divider bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            subtitle="Quem borda com a gente"
            title="O que nossos clientes dizem"
          />
        </ScrollReveal>

        <div className="relative">
          {testimonials.length > 1 ? (
            <div className="mb-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-white text-[var(--color-brown)] transition hover:scale-105 hover:bg-[var(--secondary)] active:scale-95 disabled:scale-100 disabled:opacity-40"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-white text-[var(--color-brown)] transition hover:scale-105 hover:bg-[var(--secondary)] active:scale-95 disabled:scale-100 disabled:opacity-40"
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-5">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.625rem)] lg:flex-[0_0_calc(33.333%-0.833rem)]"
                >
                  <TestimonialCard testimonial={t} />
                </div>
              ))}
            </div>
          </div>

          {testimonials.length > 1 ? (
            <div
              className="mt-4 flex justify-center gap-2"
              role="tablist"
              aria-label="Slides de depoimentos"
            >
              {testimonials.map((t, index) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`Depoimento ${index + 1}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? "w-6 bg-[var(--color-brown)]"
                      : "w-2 bg-[var(--color-brown)]/30 hover:bg-[var(--color-brown)]/50"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
