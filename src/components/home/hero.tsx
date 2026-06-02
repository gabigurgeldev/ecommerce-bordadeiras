"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { StorefrontBannerSlide } from "@/lib/data/banners";

function BannerSlide({ imageUrl, priority }: { imageUrl: string; priority?: boolean }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover object-center"
        priority={priority}
        sizes="100vw"
      />
    </div>
  );
}

export function Hero({ banners }: { banners: StorefrontBannerSlide[] }) {
  const slides = banners.length > 0 ? banners : [];
  const hasMultiple = slides.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: hasMultiple, align: "start", dragFree: false },
    hasMultiple
      ? [Autoplay({ delay: 6000, stopOnInteraction: false })]
      : [],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-bg)]">
      <div className="relative mx-auto w-full max-w-[1920px]">
        <div
          ref={emblaRef}
          className="relative w-full overflow-hidden aspect-[21/9] min-h-[220px] max-h-[480px] sm:min-h-[300px] lg:min-h-[400px]"
        >
            <div className="flex h-full">
              {slides.map((banner, index) => (
                <div
                  key={banner.id}
                  className="relative min-w-0 flex-[0_0_100%] h-full"
                >
                  {banner.link ? (
                    <Link
                      href={banner.link}
                      className="relative block h-full w-full"
                      aria-label="Ver promoção"
                    >
                      <BannerSlide imageUrl={banner.imageUrl} priority={index === 0} />
                    </Link>
                  ) : (
                    <BannerSlide imageUrl={banner.imageUrl} priority={index === 0} />
                  )}
                </div>
              ))}
            </div>

          {hasMultiple ? (
            <div
              className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2 sm:bottom-4"
              role="tablist"
              aria-label="Slides do banner"
            >
                {slides.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    role="tab"
                    aria-selected={index === selectedIndex}
                    aria-label={`Slide ${index + 1}`}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      index === selectedIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/75",
                    )}
                  />
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
