"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  }, []);

  const activeSrc = images[active] ?? images[0]!;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {images.length > 1 && (
          <div
            className={cn(
              "order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:max-h-[min(520px,70vw)] lg:w-20 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0",
            )}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={active === i ? "true" : undefined}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all lg:h-[4.5rem] lg:w-full",
                  active === i
                    ? "border-[var(--color-cta)] ring-2 ring-[var(--color-cta)]/20"
                    : "border-[var(--color-card-border)] opacity-75 hover:border-[var(--color-brown)]/30 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}

        <div className="order-1 min-w-0 flex-1 lg:order-2">
          <div
            className="relative aspect-square cursor-crosshair overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={activeSrc}
              alt={name}
              fill
              className={cn(
                "object-cover transition-transform duration-200 ease-out",
                zooming && "scale-[1.75]",
              )}
              style={zooming ? { transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
              priority
              sizes="(max-width:1024px) 100vw, 40vw"
            />
          </div>
          <p className="mt-2 hidden text-center text-xs text-[var(--muted-foreground)] lg:block">
            Passe o mouse sobre a foto para ampliar
          </p>
        </div>
      </div>
    </div>
  );
}
