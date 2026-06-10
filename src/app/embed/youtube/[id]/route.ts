import { NextResponse } from "next/server";

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

function embedHtml(iframeSrc: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    html, body { margin: 0; height: 100%; background: #000; }
    iframe { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe
    src="${iframeSrc}"
    title="${title}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</body>
</html>`;
}

const embedResponseHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy":
    "default-src 'none'; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.google.com; style-src 'unsafe-inline';",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!YOUTUBE_ID.test(id)) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const autoplay = url.searchParams.get("autoplay") === "1";

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "0",
  });
  if (autoplay) params.set("autoplay", "1");

  const iframeSrc = `https://www.youtube.com/embed/${id}?${params.toString()}`;

  return new NextResponse(embedHtml(iframeSrc, "Vídeo do produto"), {
    status: 200,
    headers: embedResponseHeaders,
  });
}
