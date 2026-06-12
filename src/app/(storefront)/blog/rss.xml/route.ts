import { buildRssXml, getBlogRssItems } from "@/lib/blog/blog-seo-service";

export const revalidate = 3600;

export async function GET() {
  try {
    const items = await getBlogRssItems(50);
    const xml = buildRssXml(items);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("[blog/rss.xml GET]", e);
    return new Response("Erro ao gerar feed RSS", { status: 500 });
  }
}
