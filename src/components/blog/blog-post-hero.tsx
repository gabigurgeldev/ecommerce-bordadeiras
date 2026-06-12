import Image from "next/image";

export function BlogPostHero({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="relative mt-8 overflow-hidden rounded-2xl border border-[var(--color-card-border)] shadow-sm sm:mt-10 sm:rounded-none sm:border-x-0 sm:shadow-none lg:-mx-8">
      <div className="relative aspect-[4/3] w-full sm:aspect-[21/9] sm:max-h-[min(52vh,520px)]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1280px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent sm:from-black/15"
          aria-hidden
        />
      </div>
    </figure>
  );
}
