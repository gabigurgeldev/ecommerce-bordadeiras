"use client";

import { useState, useCallback } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoGalleryProps {
  videoUrls: string[];
  className?: string;
}

function extractVideoId(url: string): { type: 'youtube' | 'vimeo' | null; id: string | null } {
  const cleanUrl = url.trim();
  
  // YouTube
  const youtubeMatch = cleanUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] };
  }
  
  // Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }
  
  return { type: null, id: null };
}

function getEmbedUrl(url: string): string | null {
  const { type, id } = extractVideoId(url);
  if (!id) return null;
  
  if (type === 'youtube') {
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  
  if (type === 'vimeo') {
    return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }
  
  return null;
}

function getThumbnailUrl(url: string): string | null {
  const { type, id } = extractVideoId(url);
  if (!id) return null;
  
  if (type === 'youtube') {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  
  return null;
}

export function VideoGallery({ videoUrls, className }: VideoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openVideo = useCallback((index: number) => {
    setIsLoading(true);
    setActiveIndex(index);
  }, []);

  const closeVideo = useCallback(() => {
    setActiveIndex(null);
    setIsLoading(false);
  }, []);

  const goToNext = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev !== null && prev < videoUrls.length - 1 ? prev + 1 : prev));
  }, [activeIndex, videoUrls.length]);

  const goToPrev = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, [activeIndex]);

  // Filtrar apenas URLs válidas
  const validVideos = videoUrls.filter((url) => {
    const { type } = extractVideoId(url);
    return type !== null;
  });

  if (validVideos.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Título da seção */}
      <h3 className="font-medium text-foreground">Vídeos do produto</h3>

      {/* Grid de thumbnails */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {validVideos.map((url, index) => {
          const thumbnail = getThumbnailUrl(url);
          const { type, id } = extractVideoId(url);
          const isActive = activeIndex === index;

          return (
            <button
              key={`${index}-${id}`}
              type="button"
              onClick={() => openVideo(index)}
              className={cn(
                "group relative aspect-video overflow-hidden rounded-lg border-2 transition-all",
                isActive
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Thumbnail */}
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={`Vídeo ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Play className="h-8 w-8 text-[var(--color-brown)]" />
                </div>
              )}

              {/* Overlay com ícone de play */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-white/90 p-2 shadow-lg">
                  <Play className="h-5 w-5 fill-current text-black" />
                </div>
              </div>

              {/* Badge do tipo */}
              <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {type === 'youtube' ? 'YouTube' : 'Vimeo'}
              </div>

              {/* Número do vídeo */}
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {index + 1}/{validVideos.length}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={activeIndex !== null}
        onOpenChange={(open) => !open && closeVideo()}
      >
        <DialogContent
          className="max-w-5xl border-0 bg-black/95 p-4 text-white sm:rounded-xl"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            Vídeo {activeIndex !== null ? activeIndex + 1 : ""} do produto
          </DialogTitle>

          {activeIndex !== null && activeIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={goToPrev}
              aria-label="Vídeo anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {activeIndex !== null && activeIndex < validVideos.length - 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={goToNext}
              aria-label="Próximo vídeo"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          <div className="mb-2 text-center text-sm text-white/80">
            {activeIndex !== null
              ? `${activeIndex + 1} / ${validVideos.length}`
              : null}
          </div>

          <div className="aspect-video w-full">
            {isLoading && activeIndex !== null && (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              </div>
            )}
            {activeIndex !== null && (
              <iframe
                src={getEmbedUrl(validVideos[activeIndex]) || ""}
                className="h-full w-full rounded-lg"
                title={`Vídeo ${activeIndex + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
