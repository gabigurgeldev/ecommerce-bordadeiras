"use client";

import { getAutoplayEmbedUrl, parseProductVideos, type VideoMeta } from "@/lib/product-video";
import { cn } from "@/lib/utils";
import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type MediaMode = { kind: "image"; index: number } | { kind: "video"; index: number };

export function ProductGallery({
  images,
  videoUrls = [],
  name,
}: {
  images: string[];
  videoUrls?: string[];
  name: string;
}) {
  const videos = parseProductVideos(videoUrls);
  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;

  const [media, setMedia] = useState<MediaMode>({ kind: "image", index: 0 });
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [siteOrigin, setSiteOrigin] = useState<string>();

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  }, []);

  const selectImage = (index: number) => {
    setZooming(false);
    setMedia({ kind: "image", index });
  };

  const selectVideo = (index: number) => {
    setZooming(false);
    setMedia({ kind: "video", index });
  };

  const activeImageSrc = hasImages
    ? (images[media.kind === "image" ? media.index : 0] ?? images[0])
    : null;
  const activeVideo: VideoMeta | null =
    media.kind === "video" && hasVideos ? (videos[media.index] ?? videos[0] ?? null) : null;

  const videoEmbedSrc = useMemo(
    () => (activeVideo ? getAutoplayEmbedUrl(activeVideo, siteOrigin) : null),
    [activeVideo, siteOrigin],
  );

  const showThumbnails = images.length > 1 || hasVideos;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {showThumbnails ? (
          <div
            className={cn(
              "order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:max-h-[min(520px,70vw)] lg:w-20 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0",
            )}
          >
            {images.map((src, i) => {
              const isActive = media.kind === "image" && media.index === i;
              return (
                <button
                  key={`img-${src}-${i}`}
                  type="button"
                  onClick={() => selectImage(i)}
                  aria-label={`Ver imagem ${i + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all lg:h-[4.5rem] lg:w-full",
                    isActive
                      ? "border-[var(--color-cta)] ring-2 ring-[var(--color-cta)]/20"
                      : "border-[var(--color-card-border)] opacity-75 hover:border-[var(--color-brown)]/30 hover:opacity-100",
                  )}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                </button>
              );
            })}

            {videos.map((video, i) => {
              const isActive = media.kind === "video" && media.index === i;
              return (
                <button
                  key={`vid-${video.type}-${video.id}`}
                  type="button"
                  onClick={() => selectVideo(i)}
                  aria-label={`Assistir vídeo ${i + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all lg:h-[4.5rem] lg:w-full",
                    isActive
                      ? "border-[var(--color-cta)] ring-2 ring-[var(--color-cta)]/20"
                      : "border-[var(--color-card-border)] opacity-75 hover:border-[var(--color-cta)]/50 hover:opacity-100",
                  )}
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--secondary)]">
                      <Play className="h-5 w-5 text-[var(--color-brown)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="rounded-full bg-white/95 p-1.5 shadow">
                      <Play className="h-3.5 w-3.5 fill-current text-black" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="order-1 min-w-0 flex-1 lg:order-2">
          {media.kind === "video" && activeVideo && videoEmbedSrc ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-black">
              <iframe
                key={videoEmbedSrc}
                src={videoEmbedSrc}
                title={`Vídeo do produto ${name}`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="eager"
              />
              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-white/90 hover:bg-black/90 sm:text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                {activeVideo.type === "vimeo" ? "Vimeo" : "YouTube"}
              </a>
            </div>
          ) : activeImageSrc ? (
            <div
              className="relative aspect-square cursor-crosshair overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]"
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={activeImageSrc}
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
          ) : null}

          <p className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
            {media.kind === "video"
              ? "Clique numa foto na lateral para voltar à imagem"
              : hasVideos
                ? "Clique em um vídeo na lateral para assistir aqui"
                : "Passe o mouse sobre a foto para ampliar"}
          </p>
        </div>
      </div>
    </div>
  );
}
