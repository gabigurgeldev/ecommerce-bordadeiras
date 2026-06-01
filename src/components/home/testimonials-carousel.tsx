"use client";

import { GlassCard } from "@/components/ui/glass-card";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
};

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  return (
    <section className="bg-gradient-to-b from-zinc-50 to-white py-20 dark:from-zinc-900/50 dark:to-zinc-950" data-gsap-fade>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-semibold text-zinc-900 dark:text-white">
          O que nossos clientes dizem
        </h2>
        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <GlassCard className="h-full">
                  <Quote className="h-8 w-8 text-rose-400/60" />
                  <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mt-4 font-medium text-zinc-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
