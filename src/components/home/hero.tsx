"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { StorefrontBannerSlide } from "@/lib/data/banners";

interface BannerSlideProps {
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  altText?: string | null;
  priority?: boolean;
}

function BannerSlide({ desktopImageUrl, mobileImageUrl, altText, priority }: BannerSlideProps) {
  return (
    <div className="relative h-full w-full">
      {/* Desktop Image (hidden on mobile) */}
      <div className="hidden sm:block absolute inset-0">
        <Image
          src={desktopImageUrl}
          alt={altText || "Banner"}
          fill
          className="object-cover object-center"
          priority={priority}
          sizes="(min-width: 640px) 100vw, 0vw"
        />
      </div>

      {/* Mobile Image - show mobile version if available, otherwise show desktop */}
      <div className="block sm:hidden absolute inset-0">
        <Image
          src={mobileImageUrl || desktopImageUrl}
          alt={altText || "Banner"}
          fill
          className="object-cover object-center"
          priority={priority}
          sizes="(max-width: 639px) 100vw, 0vw"
        />
      </div>
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
          className="relative w-full overflow-hidden aspect-[4/3] min-h-[260px] max-h-[520px] sm:aspect-[21/9] sm:min-h-[300px] lg:min-h-[400px]"
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
                      aria-label={banner.altText || "Ver promoção"}
                    >
                      <BannerSlide 
                        desktopImageUrl={banner.desktopImageUrl || banner.imageUrl}
                        mobileImageUrl={banner.mobileImageUrl}
                        altText={banner.altText}
                        priority={index === 0} 
                      />
                    </Link>
                  ) : (
                    <BannerSlide 
                      desktopImageUrl={banner.desktopImageUrl || banner.imageUrl}
                      mobileImageUrl={banner.mobileImageUrl}
                      altText={banner.altText}
                      priority={index === 0} 
                    />
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
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center"
                  >
                    <span
                      className={cn(
                        "block h-2 rounded-full transition-all",
                        index === selectedIndex
                          ? "w-6 bg-white"
                          : "w-2 bg-white/50 hover:bg-white/75",
                      )}
                    />
                  </button>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
