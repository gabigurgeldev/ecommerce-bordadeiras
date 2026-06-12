import { extractYouTubeVideoId } from "@/lib/blog/youtube-service";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title?: string;
  className?: string;
};

export function BlogYouTubeEmbed({ url, title, className }: Props) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return (
    <section
      className={cn("mt-10", className)}
      aria-labelledby="blog-video-heading"
    >
      <p className="text-section-subtitle">Vídeo</p>
      <h2
        id="blog-video-heading"
        className="mt-1 font-display text-xl font-semibold text-[var(--color-brown)] sm:text-2xl"
      >
        Assista ao vídeo
      </h2>
      <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-brown)] shadow-lg ring-1 ring-[var(--color-card-border)]">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title ?? "Vídeo do YouTube"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
        <span
          className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          aria-hidden
        >
          <Play className="h-3 w-3 fill-current" />
          YouTube
        </span>
      </div>
    </section>
  );
}
