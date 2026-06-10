export type VideoMeta = {
  type: "youtube" | "vimeo";
  id: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string | null;
};

function buildYoutubeEmbed(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    ...(autoplay ? { autoplay: "1" } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

function buildVimeoEmbed(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    ...(autoplay ? { autoplay: "1" } : {}),
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

export function getAutoplayEmbedUrl(video: VideoMeta, siteOrigin?: string): string {
  if (video.type === "youtube") {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      autoplay: "1",
    });
    if (siteOrigin) params.set("origin", siteOrigin);
    return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`;
  }
  return buildVimeoEmbed(video.id, true);
}

export function parseProductVideo(url: string): VideoMeta | null {
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  let normalized = cleanUrl;
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return {
          type: "youtube",
          id,
          url: cleanUrl,
          embedUrl: buildYoutubeEmbed(id),
          thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        };
      }
    }
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtube-nocookie.com")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return {
          type: "youtube",
          id: v,
          url: cleanUrl,
          embedUrl: buildYoutubeEmbed(v),
          thumbnailUrl: `https://img.youtube.com/vi/${v}/hqdefault.jpg`,
        };
      }
      const pathMatch = parsed.pathname.match(/\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch) {
        const id = pathMatch[1];
        return {
          type: "youtube",
          id,
          url: cleanUrl,
          embedUrl: buildYoutubeEmbed(id),
          thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        };
      }
    }
  } catch {
    /* fall through to regex */
  }

  const youtubeMatch = cleanUrl.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      type: "youtube",
      id,
      url: cleanUrl,
      embedUrl: buildYoutubeEmbed(id),
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      type: "vimeo",
      id,
      url: cleanUrl,
      embedUrl: buildVimeoEmbed(id),
      thumbnailUrl: null,
    };
  }

  return null;
}

export function parseProductVideos(urls: string[]): VideoMeta[] {
  return urls.map(parseProductVideo).filter((v): v is VideoMeta => v != null);
}
