export type YouTubeValidationResult = {
  valid: boolean;
  videoId?: string;
  normalizedUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  error?: string;
};

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes("youtube.com") && parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    for (const pattern of YOUTUBE_PATTERNS) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function getYouTubeThumbnailUrl(videoId: string, quality: "default" | "hq" = "hq"): string {
  const suffix = quality === "hq" ? "hqdefault" : "default";
  return `https://img.youtube.com/vi/${videoId}/${suffix}.jpg`;
}

export function normalizeYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function fetchYouTubeTitle(url: string): Promise<string | undefined> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { title?: string };
    return data.title?.trim();
  } catch {
    return undefined;
  }
}

export async function validateYouTubeUrl(url: string): Promise<YouTubeValidationResult> {
  const trimmed = url?.trim();
  if (!trimmed) {
    return { valid: false, error: "Informe a URL do YouTube" };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { valid: false, error: "URL inválida" };
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");
  if (!["youtube.com", "youtu.be", "m.youtube.com"].includes(host)) {
    return { valid: false, error: "A URL deve ser de um vídeo do YouTube" };
  }

  const videoId = extractYouTubeVideoId(trimmed);
  if (!videoId) {
    return { valid: false, error: "Não foi possível identificar o vídeo do YouTube" };
  }

  const normalizedUrl = normalizeYouTubeUrl(videoId);
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  const title = await fetchYouTubeTitle(normalizedUrl);

  return {
    valid: true,
    videoId,
    normalizedUrl,
    thumbnailUrl,
    title,
  };
}
