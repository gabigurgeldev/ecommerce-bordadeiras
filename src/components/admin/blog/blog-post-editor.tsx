"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateBlogPost,
  adminPublishBlogPost,
  adminSoftDeleteBlogPost,
  adminUpdateBlogPost,
} from "@/actions/admin/blog-ext";
import { upsertBlogTag } from "@/actions/admin/blog";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { BlogAiPanel } from "@/components/admin/blog/blog-ai-panel";
import { BlogContentAiButton } from "@/components/admin/blog/blog-content-ai-button";
import { BlogFieldAiButton } from "@/components/admin/blog/blog-field-ai-button";
import { BlogRichEditor } from "@/components/admin/blog/blog-rich-editor";
import { BlogSeoPanel } from "@/components/admin/blog/blog-seo-panel";
import { BlogCategoryFormDialog } from "@/components/admin/blog/blog-category-form-dialog";
import { BlogStatusBadge } from "@/components/admin/blog/blog-status-badge";
import { estimateReadingTime } from "@/components/admin/blog/blog-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BlogPostStatus } from "@/lib/types/database";
import type { BlogCategory, BlogTag } from "@/lib/types/database";
import { extractYouTubeVideoId } from "@/lib/blog/youtube-service";
import { slugify } from "@/lib/utils";
import type { BlogPostRow } from "@/components/admin/blog/blog-utils";

const TITLE_MAX = 120;

type EditorState = {
  title: string;
  slug: string;
  slugManual: boolean;
  excerpt: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  youtubeUrl: string;
  youtubeAsFeatured: boolean;
  youtubeAtTop: boolean;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  tagIds: string[];
  visibility: "public" | "private";
};

function defaultState(): EditorState {
  return {
    title: "",
    slug: "",
    slugManual: false,
    excerpt: "",
    content: "",
    coverImage: "",
    coverAlt: "",
    youtubeUrl: "",
    youtubeAsFeatured: false,
    youtubeAtTop: true,
    status: BlogPostStatus.DRAFT,
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    categoryId: "",
    tagIds: [],
    visibility: "public",
  };
}

function postToState(post: BlogPostRow): EditorState {
  return {
    title: post.title,
    slug: post.slug,
    slugManual: true,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage ?? "",
    coverAlt: "",
    youtubeUrl: post.youtubeUrl ?? "",
    youtubeAsFeatured: false,
    youtubeAtTop: true,
    status: post.status,
    publishedAt: post.publishedAt?.slice(0, 16) ?? "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    categoryId: post.categoryId ?? "",
    tagIds: post.tagIds,
    visibility: "public",
  };
}

async function uploadBlogCover(postId: string, file: File): Promise<string | null> {
  const form = new FormData();
  form.set("postId", postId);
  form.set("file", file);
  const res = await fetch("/api/admin/blog/media", { method: "POST", body: form });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha no upload");
  }
  const data = (await res.json()) as { data?: { url?: string; publicUrl?: string } };
  return data.data?.url ?? data.data?.publicUrl ?? null;
}

export function BlogPostEditor({
  post,
  categories: initialCategories,
  tags: initialTags,
}: {
  post?: BlogPostRow;
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const router = useRouter();
  const isEdit = Boolean(post?.id);
  const [state, setState] = useState<EditorState>(() => (post ? postToState(post) : defaultState()));
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | undefined>(post?.id);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytPreview, setYtPreview] = useState<{
    title?: string;
    thumbnail?: string;
    videoId?: string;
  } | null>(null);

  const effectivePostId = savedPostId ?? post?.id;

  useEffect(() => {
    if (!state.slugManual && state.title) {
      setState((s) => ({ ...s, slug: slugify(state.title) }));
    }
  }, [state.title, state.slugManual]);

  const categoryPostsCount = useMemo(
    () => categories.find((c) => c.id === state.categoryId)?.postsCount ?? 0,
    [categories, state.categoryId],
  );

  const patch = useCallback((partial: Partial<EditorState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const saveDraftRef = useCallback(async () => {
    if (state.title.trim().length < 3) {
      toast.error("Título deve ter pelo menos 3 caracteres");
      return null;
    }
    if (state.content.length < 10) {
      toast.error("Conteúdo deve ter pelo menos 10 caracteres");
      return null;
    }

    setSaving(true);
    const payload = {
      title: state.title.trim(),
      slug: state.slug.trim() || slugify(state.title),
      excerpt: state.excerpt.trim() || null,
      content: state.content,
      coverImage: state.coverImage.trim() || null,
      youtubeUrl: state.youtubeUrl.trim() || null,
      status: state.status as typeof BlogPostStatus.DRAFT,
      publishedAt: state.status === BlogPostStatus.SCHEDULED && state.publishedAt
        ? new Date(state.publishedAt).toISOString()
        : null,
      seoTitle: state.seoTitle.trim() || null,
      seoDescription: state.seoDescription.trim() || null,
      categoryId: state.categoryId || null,
      tagIds: state.tagIds,
      published: state.status === BlogPostStatus.PUBLISHED,
    };
    const res = isEdit
      ? await adminUpdateBlogPost(post!.id, payload)
      : await adminCreateBlogPost(payload);
    setSaving(false);

    if (!res.success) {
      toast.error(res.error ?? "Erro ao salvar");
      return null;
    }

    toast.success("Rascunho salvo");
    if (res.data?.id) {
      setSavedPostId(res.data.id);
    }
    if (!isEdit && res.data?.id) {
      router.replace(`/admin/blog/posts/${res.data.id}`);
    } else {
      router.refresh();
    }
    return res.data?.id ?? post?.id ?? null;
  }, [isEdit, post, router, state]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        void saveDraftRef();
      }
      if (e.key === "p") {
        e.preventDefault();
        if (isEdit && state.slug) {
          window.open(`/blog/${state.slug}`, "_blank", "noopener,noreferrer");
        } else {
          toast.info("Salve o rascunho primeiro para pré-visualizar");
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEdit, saveDraftRef, state.slug]);

  function buildPayload() {
    return {
      title: state.title.trim(),
      slug: state.slug.trim() || slugify(state.title),
      excerpt: state.excerpt.trim() || null,
      content: state.content,
      coverImage: state.coverImage.trim() || null,
      youtubeUrl: state.youtubeUrl.trim() || null,
      status: state.status as typeof BlogPostStatus.DRAFT,
      publishedAt: state.status === BlogPostStatus.SCHEDULED && state.publishedAt
        ? new Date(state.publishedAt).toISOString()
        : null,
      seoTitle: state.seoTitle.trim() || null,
      seoDescription: state.seoDescription.trim() || null,
      categoryId: state.categoryId || null,
      tagIds: state.tagIds,
      published: state.status === BlogPostStatus.PUBLISHED,
    };
  }

  async function saveDraft() {
    return saveDraftRef();
  }

  async function handlePublish() {
    const id = isEdit ? post!.id : await saveDraftRef();
    if (!id) return;

    setSaving(true);
    if (!isEdit) {
      await adminUpdateBlogPost(id, { ...buildPayload(), status: BlogPostStatus.PUBLISHED, published: true });
    }
    const res = await adminPublishBlogPost(id);
    setSaving(false);

    if (res.success) {
      toast.success("Post publicado");
      patch({ status: BlogPostStatus.PUBLISHED });
      router.refresh();
    } else toast.error(res.error);
  }

  const aiInput = useMemo(
    () => ({
      title: state.title,
      excerpt: state.excerpt,
      content: state.content,
      seoTitle: state.seoTitle,
      seoDescription: state.seoDescription,
      coverAlt: state.coverAlt,
    }),
    [state.title, state.excerpt, state.content, state.seoTitle, state.seoDescription, state.coverAlt],
  );

  const hasAiContext = Boolean(state.title.trim() || state.content.trim().length >= 10);

  const fetchYouTubePreview = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setYtPreview(null);
      return;
    }
    setYtLoading(true);
    try {
      const res = await fetch(
        `/api/admin/blog/media/youtube?url=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) throw new Error("URL inválida");
      const data = (await res.json()) as {
        data?: { title?: string; thumbnailUrl?: string; videoId?: string };
      };
      const preview = {
        title: data.data?.title,
        thumbnail: data.data?.thumbnailUrl,
        videoId: data.data?.videoId ?? extractYouTubeVideoId(trimmed) ?? undefined,
      };
      setYtPreview(preview);
      if (state.youtubeAsFeatured && preview.thumbnail) {
        patch({ coverImage: preview.thumbnail });
      }
    } catch {
      setYtPreview(null);
      toast.error("Não foi possível carregar o vídeo");
    } finally {
      setYtLoading(false);
    }
  }, [patch, state.youtubeAsFeatured]);

  useEffect(() => {
    const url = state.youtubeUrl.trim();
    if (!url) {
      setYtPreview(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchYouTubePreview(url);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [state.youtubeUrl, fetchYouTubePreview]);

  const ensurePostIdForUpload = useCallback(async (): Promise<string | null> => {
    if (effectivePostId) return effectivePostId;

    toast.info("Salvando rascunho para enviar a imagem…");
    setSaving(true);
    const draftTitle = state.title.trim().length >= 3 ? state.title.trim() : "Novo post";
    const draftContent =
      state.content.length >= 10 ? state.content : "<p>Rascunho em edição.</p>";
    const res = await adminCreateBlogPost({
      title: draftTitle,
      slug: state.slug.trim() || slugify(draftTitle),
      excerpt: state.excerpt.trim() || null,
      content: draftContent,
      coverImage: null,
      youtubeUrl: state.youtubeUrl.trim() || null,
      status: BlogPostStatus.DRAFT,
      publishedAt: null,
      seoTitle: state.seoTitle.trim() || null,
      seoDescription: state.seoDescription.trim() || null,
      categoryId: state.categoryId || null,
      tagIds: state.tagIds,
      published: false,
    });
    setSaving(false);

    if (!res.success) {
      toast.error(res.error ?? "Salve o rascunho antes de enviar imagens");
      return null;
    }
    if (!res.data?.id) {
      toast.error("Salve o rascunho antes de enviar imagens");
      return null;
    }

    setSavedPostId(res.data.id);
    if (!state.title.trim() || state.content.length < 10) {
      patch({ title: draftTitle, content: draftContent });
    }
    router.replace(`/admin/blog/posts/${res.data.id}`);
    return res.data.id;
  }, [effectivePostId, patch, router, state]);

  const onDropCover = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const postId = await ensurePostIdForUpload();
      if (!postId) return;
      setUploading(true);
      try {
        const url = await uploadBlogCover(postId, file);
        if (url) {
          patch({ coverImage: url });
          toast.success("Imagem enviada");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro no upload");
      } finally {
        setUploading(false);
      }
    },
    [ensurePostIdForUpload, patch],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => void onDropCover(f),
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxFiles: 1,
    disabled: uploading,
  });

  async function addTagByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!state.tagIds.includes(existing.id)) {
        patch({ tagIds: [...state.tagIds, existing.id] });
      }
      setTagInput("");
      return;
    }
    const res = await upsertBlogTag({ name: trimmed, slug: slugify(trimmed) });
    if (!res.success) {
      toast.error(res.error ?? "Erro ao criar tag");
      return;
    }
    if (res.data?.id) {
      const newTag = { id: res.data.id, name: trimmed, slug: slugify(trimmed), createdAt: new Date() };
      setTags((t) => [...t, newTag]);
      patch({ tagIds: [...state.tagIds, res.data!.id] });
      setTagInput("");
      toast.success("Tag criada");
    }
  }

  return (
    <AdminPageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/blog/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{isEdit ? "Editar post" : "Novo post"}</h1>
            {isEdit && <BlogStatusBadge status={state.status} className="mt-1" />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void saveDraft()} title="Ctrl+S">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar rascunho
          </Button>
          {isEdit && (
            <Button type="button" variant="outline" asChild title="Ctrl+P">
              <Link href={`/blog/${state.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Prévia
              </Link>
            </Button>
          )}
          <Button type="button" disabled={saving} onClick={() => void handlePublish()}>
            Publicar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="post-title">Título</Label>
                  <div className="flex items-center gap-2">
                    <BlogFieldAiButton
                      scope="title"
                      label="Sugerir com IA"
                      input={aiInput}
                      disabled={saving || !hasAiContext}
                      onApply={(fields) => {
                        if (fields.title) patch({ title: fields.title.slice(0, TITLE_MAX) });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{state.title.length}/{TITLE_MAX}</span>
                  </div>
                </div>
                <Input
                  id="post-title"
                  value={state.title}
                  onChange={(e) => patch({ title: e.target.value.slice(0, TITLE_MAX) })}
                  placeholder="Título do post"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-slug">Slug</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => patch({ slug: slugify(state.title), slugManual: true })}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Regenerar
                  </Button>
                </div>
                <Input
                  id="post-slug"
                  value={state.slug}
                  onChange={(e) => patch({ slug: e.target.value, slugManual: true })}
                  placeholder="url-amigavel"
                />
                <p className="text-xs text-muted-foreground">/blog/{state.slug || "…"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Conteúdo</CardTitle>
              <BlogContentAiButton
                title={state.title}
                content={state.content}
                disabled={saving}
                onApply={(html) => patch({ content: html })}
              />
            </CardHeader>
            <CardContent>
              <BlogRichEditor
                value={state.content}
                onChange={(html) => patch({ content: html })}
                onSelectionChange={(text) => setSelectedText(text)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Resumo</CardTitle>
                <CardDescription>Exibido em listagens e compartilhamentos</CardDescription>
              </div>
              <BlogFieldAiButton
                scope="excerpt"
                label="Gerar com IA"
                input={aiInput}
                disabled={saving || !hasAiContext}
                onApply={(fields) => {
                  if (fields.excerpt) patch({ excerpt: fields.excerpt });
                }}
              />
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={state.excerpt}
                onChange={(e) => patch({ excerpt: e.target.value })}
                placeholder="Breve descrição do post…"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status e publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={state.status}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  <option value={BlogPostStatus.DRAFT}>Rascunho</option>
                  <option value={BlogPostStatus.PUBLISHED}>Publicado</option>
                  <option value={BlogPostStatus.SCHEDULED}>Agendado</option>
                  <option value={BlogPostStatus.ARCHIVED}>Arquivado</option>
                </select>
              </div>
              {state.status === BlogPostStatus.SCHEDULED && (
                <div className="space-y-2">
                  <Label htmlFor="published-at">Data de publicação</Label>
                  <Input
                    id="published-at"
                    type="datetime-local"
                    value={state.publishedAt}
                    onChange={(e) => patch({ publishedAt: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="visibility">Visível no blog</Label>
                <Switch
                  id="visibility"
                  checked={state.visibility === "public"}
                  onCheckedChange={(v) => patch({ visibility: v ? "public" : "private" })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo de leitura: ~{estimateReadingTime(state.content)} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={state.categoryId}
                onChange={(e) => patch({ categoryId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {state.categoryId && (
                <p className="text-xs text-muted-foreground">{categoryPostsCount} posts nesta categoria</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                Nova categoria
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
              <BlogFieldAiButton
                scope="tags"
                label="Sugerir com IA"
                input={aiInput}
                disabled={saving || !hasAiContext}
                onApply={(fields) => {
                  if (!fields.tags) return;
                  const names = fields.tags.split(",").map((t) => t.trim()).filter(Boolean);
                  void (async () => {
                    for (const name of names) {
                      await addTagByName(name);
                    }
                  })();
                }}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {state.tagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id);
                  if (!tag) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => patch({ tagIds: state.tagIds.filter((t) => t !== id) })}
                        aria-label={`Remover ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <Input
                placeholder="Digite e pressione Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addTagByName(tagInput);
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagem de destaque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                {...getRootProps()}
                className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
              >
                <input {...getInputProps()} />
                {state.coverImage ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md">
                    <Image
                      src={state.coverImage}
                      alt={state.coverAlt || "Imagem de destaque"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        patch({ coverImage: "", coverAlt: "" });
                      }}
                      aria-label="Remover imagem"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-center text-xs text-muted-foreground">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    {!effectivePostId && (
                      <p className="mt-1 text-center text-[10px] text-muted-foreground">
                        O rascunho será salvo automaticamente no primeiro envio
                      </p>
                    )}
                  </>
                )}
                {uploading && <Loader2 className="absolute h-6 w-6 animate-spin text-primary" />}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="cover-alt">Texto alternativo (alt)</Label>
                  <BlogFieldAiButton
                    scope="coverAlt"
                    label="Gerar com IA"
                    input={aiInput}
                    disabled={saving || !hasAiContext}
                    onApply={(fields) => {
                      if (fields.coverAlt) patch({ coverAlt: fields.coverAlt });
                    }}
                  />
                </div>
                <Input
                  id="cover-alt"
                  placeholder="Descreva a imagem para acessibilidade"
                  value={state.coverAlt}
                  onChange={(e) => patch({ coverAlt: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">YouTube</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">URL do vídeo</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://youtube.com/watch?v=…"
                  value={state.youtubeUrl}
                  onChange={(e) => patch({ youtubeUrl: e.target.value })}
                />
              </div>
              {ytLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Carregando vídeo…
                </div>
              )}
              {ytPreview?.videoId && (
                <div className="relative aspect-video overflow-hidden rounded-md border">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytPreview.videoId}`}
                    title={ytPreview.title ?? "Prévia do vídeo"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              )}
              {ytPreview?.title && (
                <p className="text-xs font-medium text-foreground">{ytPreview.title}</p>
              )}
              {ytPreview?.thumbnail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    patch({ coverImage: ytPreview.thumbnail! });
                    toast.success("Thumbnail definida como capa");
                  }}
                >
                  <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                  Usar thumbnail como capa
                </Button>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-xs">Aplicar thumbnail automaticamente</Label>
                <Switch
                  checked={state.youtubeAsFeatured}
                  onCheckedChange={(v) => {
                    patch({
                      youtubeAsFeatured: v,
                      ...(v && ytPreview?.thumbnail ? { coverImage: ytPreview.thumbnail } : {}),
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Exibir no topo do post</Label>
                <Switch checked={state.youtubeAtTop} onCheckedChange={(v) => patch({ youtubeAtTop: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">SEO</CardTitle>
              <BlogFieldAiButton
                scope="seo"
                label="Gerar com IA"
                input={aiInput}
                disabled={saving || !hasAiContext}
                variant="default"
                onApply={(fields) => {
                  patch({
                    seoTitle: fields.seoTitle?.slice(0, 60) ?? state.seoTitle,
                    seoDescription: fields.seoDescription?.slice(0, 160) ?? state.seoDescription,
                  });
                }}
              />
            </CardHeader>
            <CardContent>
              <BlogSeoPanel
                title={state.title}
                slug={state.slug}
                seoTitle={state.seoTitle}
                seoDescription={state.seoDescription}
                excerpt={state.excerpt}
                content={state.content}
                coverImage={state.coverImage}
                onSeoTitleChange={(v) => patch({ seoTitle: v })}
                onSeoDescriptionChange={(v) => patch({ seoDescription: v })}
              />
            </CardContent>
          </Card>

          <BlogAiPanel
            title={state.title}
            excerpt={state.excerpt}
            content={state.content}
            seoTitle={state.seoTitle}
            seoDescription={state.seoDescription}
            selectedText={selectedText}
            onApply={(fields) => {
              patch({
                title: fields.title ?? state.title,
                excerpt: fields.excerpt ?? state.excerpt,
                content: fields.content ?? state.content,
                seoTitle: fields.seoTitle ?? state.seoTitle,
                seoDescription: fields.seoDescription ?? state.seoDescription,
              });
            }}
          />

          {isEdit && (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir post
            </Button>
          )}
        </aside>
      </div>

      <BlogCategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(cat) => {
          setCategories((c) => [...c, cat]);
          patch({ categoryId: cat.id });
        }}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir post?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          const res = await adminSoftDeleteBlogPost(post!.id);
          if (res.success) {
            toast.success("Post excluído");
            router.push("/admin/blog/posts");
          } else toast.error(res.error);
        }}
      />
    </AdminPageContainer>
  );
}
