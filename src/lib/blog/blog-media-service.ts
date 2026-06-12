import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { mapBlogMediaRow } from "@/lib/blog/mappers";
import { emptyToNull } from "@/lib/blog/utils";
import { BlogMediaType } from "@/lib/types/database";
import type { BlogMediaInput } from "@/lib/validations/blog";
import { STORAGE_BUCKETS, getPublicUrl, uploadFile } from "@/lib/storage";
import { validateYouTubeUrl, extractYouTubeVideoId } from "@/lib/blog/youtube-service";
import { optimizeBlogImage } from "@/lib/blog/image-optimize";
import { getBlogPostById } from "@/lib/blog/blog-post-service";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function buildBlogImageKey(postId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `blog/${postId}/${Date.now()}-${safe}`;
}

export async function listBlogMedia(postId: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogMedia)
    .select("*")
    .eq("postId", postId)
    .order("sortOrder", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapBlogMediaRow(row as Record<string, unknown>));
}

export async function createBlogMedia(input: BlogMediaInput) {
  const post = await getBlogPostById(input.postId);
  if (!post) throw new Error("Post não encontrado");

  if (input.type === BlogMediaType.YOUTUBE) {
    const validation = await validateYouTubeUrl(input.url);
    if (!validation.valid) throw new Error(validation.error ?? "URL do YouTube inválida");
  }

  const id = newId();
  const now = new Date().toISOString();
  const { error } = await getDb().from(TABLES.BlogMedia).insert({
    id,
    postId: input.postId,
    type: input.type,
    url: input.url.trim(),
    altText: emptyToNull(input.altText ?? null),
    sortOrder: input.sortOrder ?? 0,
    createdAt: now,
  });
  if (error) throw new Error(error.message);

  return { id };
}

export async function deleteBlogMedia(id: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogMedia)
    .delete()
    .eq("id", id)
    .select("id, url, type")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Mídia não encontrada");
  return data;
}

export async function uploadBlogImage(params: {
  postId: string;
  file: File;
}): Promise<{ publicUrl: string; mediaId: string }> {
  const post = await getBlogPostById(params.postId);
  if (!post) throw new Error("Post não encontrado");

  if (!ALLOWED_TYPES.has(params.file.type)) {
    throw new Error("Tipo de imagem não suportado");
  }
  if (params.file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande (máx. 8 MB)");
  }

  const bucket = STORAGE_BUCKETS.productImages;
  const rawBuffer = Buffer.from(await params.file.arrayBuffer());
  const isGif = params.file.type === "image/gif";

  let uploadBuffer: Buffer = rawBuffer;
  let contentType = params.file.type;
  let filename = params.file.name;

  if (!isGif) {
    const optimized = await optimizeBlogImage(rawBuffer);
    uploadBuffer = optimized.buffer;
    contentType = optimized.contentType;
    filename = params.file.name.replace(/\.[^.]+$/i, "") + ".webp";
  }

  const path = buildBlogImageKey(params.postId, filename);

  const publicUrl = await uploadFile({
    bucket,
    path,
    body: uploadBuffer,
    contentType,
  });

  const { id } = await createBlogMedia({
    postId: params.postId,
    type: BlogMediaType.IMAGE,
    url: publicUrl,
    altText: params.file.name,
  });

  return { publicUrl, mediaId: id };
}

export async function addYouTubeMedia(postId: string, url: string) {
  const validation = await validateYouTubeUrl(url);
  if (!validation.valid || !validation.videoId) {
    throw new Error(validation.error ?? "URL do YouTube inválida");
  }

  const thumbnailUrl = validation.thumbnailUrl ?? getYouTubeThumbnail(validation.videoId);
  const { id } = await createBlogMedia({
    postId,
    type: BlogMediaType.YOUTUBE,
    url: validation.normalizedUrl ?? url,
    altText: validation.title ?? "Vídeo do YouTube",
  });

  return {
    mediaId: id,
    videoId: validation.videoId,
    thumbnailUrl,
    title: validation.title ?? null,
    normalizedUrl: validation.normalizedUrl ?? url,
  };
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export async function deleteBlogMediaFile(url: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const prefix = `${base}/storage/v1/object/public/${STORAGE_BUCKETS.productImages}/`;
  if (!url.startsWith(prefix)) return;

  const path = url.slice(prefix.length);
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(STORAGE_BUCKETS.productImages).remove([path]);
}

export { extractYouTubeVideoId, getYouTubeThumbnail };
