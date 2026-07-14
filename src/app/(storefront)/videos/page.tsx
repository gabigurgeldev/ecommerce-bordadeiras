import { SectionHeader } from "@/components/home/section-header";
import { getActiveVideos, type StorefrontVideoItem } from "@/lib/data/videos";
import { parseProductVideo } from "@/lib/product-video";
import { buildMetadata } from "@/lib/seo/metadata";
import { Video } from "lucide-react";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Vídeos",
  description:
    "Assista aos vídeos das Bordadeiras de Serra Pelada — bastidores, histórias e o cotidiano do ateliê.",
  path: "/videos",
});

function resolveEmbedUrl(url: string): string | null {
  const meta = parseProductVideo(url);
  if (meta) return meta.embedUrl;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return url;
  } catch {
    /* invalid */
  }
  return null;
}

function VideoEmbed({ video }: { video: StorefrontVideoItem }) {
  const embedUrl = resolveEmbedUrl(video.url);

  return (
    <article className="min-w-0">
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-brown)]/5">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--muted-foreground)]">
            <Video className="h-8 w-8 opacity-40" aria-hidden />
            <p>Não foi possível carregar este vídeo.</p>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1.5">
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-brown)] sm:text-2xl">
          {video.title}
        </h2>
        {video.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {video.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default async function VideosPage() {
  const videos = await getActiveVideos();

  return (
    <div className="relative min-h-[50vh]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--color-brown) 12%, transparent), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container-px mx-auto max-w-5xl py-12 sm:py-16 lg:py-20">
        <SectionHeader
          subtitle="Galeria"
          title="Vídeos"
          description="Histórias, bastidores e o fazer das Bordadeiras de Serra Pelada."
          className="mb-10 sm:mb-14"
        />

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Video
              className="h-10 w-10 text-[var(--color-brown-muted)] opacity-50"
              aria-hidden
            />
            <p className="font-display text-lg text-[var(--color-brown)]">
              Em breve novos vídeos
            </p>
            <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
              Estamos preparando conteúdos em vídeo para compartilhar com você.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-12 sm:gap-16">
            {videos.map((video) => (
              <VideoEmbed key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
