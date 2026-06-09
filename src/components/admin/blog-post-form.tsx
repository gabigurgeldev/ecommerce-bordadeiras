"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { blogPostSchema } from "@/lib/validations/admin";
import { upsertBlogPost, deleteBlogPost } from "@/actions/admin/blog";
import { slugify } from "@/lib/utils";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AiImproveButton } from "@/components/admin/ai-improve-button";
import {
  AdminWizardDialog,
  type WizardStep,
} from "@/components/admin/admin-wizard-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogCategory, BlogPost, BlogTag } from "@/lib/types/database";
import type { z } from "zod";

type PostWithTags = BlogPost & {
  tags: { tag: BlogTag }[];
};

type FormValues = z.infer<typeof blogPostSchema>;

export const BLOG_POST_WIZARD_STEPS: WizardStep[] = [
  {
    id: "basics",
    title: "Título e slug",
    description: "Nome do post e URL amigável.",
  },
  {
    id: "content",
    title: "Conteúdo",
    description: "Texto principal e resumo para listagens.",
  },
  {
    id: "media",
    title: "Categoria e capa",
    description: "Organize o post e adicione imagem de destaque.",
  },
  {
    id: "seo",
    title: "SEO e publicação",
    description: "Metadados para buscadores e status do post.",
  },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["title", "slug"],
  ["content", "excerpt"],
  ["categoryId", "coverImage", "tagIds"],
  ["seoTitle", "seoDescription", "published"],
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function BlogPostFormFields({
  form,
  step,
  categories,
  tags,
}: {
  form: UseFormReturn<FormValues>;
  step: number;
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const errors = form.formState.errors;

  if (step === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="blog-title">Título</Label>
          <Input id="blog-title" {...form.register("title")} />
          <FieldError message={errors.title?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog-slug">Slug</Label>
          <Input id="blog-slug" {...form.register("slug")} placeholder="meu-post-no-blog" />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para gerar automaticamente a partir do título.
          </p>
          <FieldError message={errors.slug?.message} />
        </div>
      </div>
    );
  }

  if (step === 1) {
    const title = form.watch("title");
    const excerpt = form.watch("excerpt") ?? "";
    const content = form.watch("content") ?? "";
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <AiImproveButton
            context="blog"
            scope="content"
            input={{ title, excerpt, content }}
            disabled={!title?.trim()}
            onImprove={(fields) => {
              if (fields.excerpt) form.setValue("excerpt", fields.excerpt, { shouldValidate: true });
              if (fields.content) form.setValue("content", fields.content, { shouldValidate: true });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog-excerpt">Resumo</Label>
          <Textarea
            id="blog-excerpt"
            rows={3}
            placeholder="Breve descrição exibida nas listagens…"
            {...form.register("excerpt")}
          />
          <FieldError message={errors.excerpt?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog-content">Conteúdo</Label>
          <Textarea
            id="blog-content"
            rows={12}
            placeholder="Escreva o conteúdo do post…"
            {...form.register("content")}
          />
          <FieldError message={errors.content?.message} />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="blog-category">Categoria</Label>
          <select
            id="blog-category"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            {...form.register("categoryId")}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog-cover">Imagem de capa (URL)</Label>
          <Input
            id="blog-cover"
            placeholder="https://…"
            {...form.register("coverImage")}
          />
          <FieldError message={errors.coverImage?.message} />
        </div>
        {tags.length > 0 && (
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 rounded-md border p-3">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm hover:bg-muted"
                >
                  <input type="checkbox" value={tag.id} {...form.register("tagIds")} />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AiImproveButton
          context="blog"
          scope="seo"
          input={{
            title: form.watch("title"),
            excerpt: form.watch("excerpt") ?? "",
            seoTitle: form.watch("seoTitle") ?? "",
            seoDescription: form.watch("seoDescription") ?? "",
          }}
          disabled={!form.watch("title")?.trim()}
          onImprove={(fields) => {
            if (fields.seoTitle) form.setValue("seoTitle", fields.seoTitle, { shouldValidate: true });
            if (fields.seoDescription) {
              form.setValue("seoDescription", fields.seoDescription, { shouldValidate: true });
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="blog-seo-title">SEO título</Label>
        <Input
          id="blog-seo-title"
          placeholder={form.watch("title") || "Título para buscadores"}
          {...form.register("seoTitle")}
        />
        <FieldError message={errors.seoTitle?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="blog-seo-desc">SEO descrição</Label>
        <Textarea
          id="blog-seo-desc"
          rows={3}
          placeholder="Descrição exibida nos resultados de busca…"
          {...form.register("seoDescription")}
        />
        <FieldError message={errors.seoDescription?.message} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
        <input
          type="checkbox"
          className="mt-0.5"
          {...form.register("published")}
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">Publicar post</span>
          <span className="block text-xs text-muted-foreground">
            Posts não publicados ficam visíveis apenas no admin como rascunho.
          </span>
        </span>
      </label>
    </div>
  );
}

const defaultFormValues: FormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
  seoTitle: "",
  seoDescription: "",
  categoryId: "",
  tagIds: [],
};

export type BlogPostEditData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  tagIds: string[];
};

function postToFormValues(post: BlogPostEditData): FormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage ?? "",
    published: post.published,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    categoryId: post.categoryId ?? "",
    tagIds: post.tagIds,
  };
}

async function validateBlogPostStep(form: UseFormReturn<FormValues>, index: number) {
  if (index === 0) {
    const title = form.getValues("title");
    const slug = form.getValues("slug");
    if (!slug.trim()) {
      form.setValue("slug", slugify(title), { shouldValidate: true });
    }
  }

  const fields = STEP_FIELDS[index];
  return form.trigger(fields);
}

export function BlogPostCreateWizard({
  categories,
  tags,
  open,
  onOpenChange,
}: {
  categories: BlogCategory[];
  tags: BlogTag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      setStep(0);
      form.reset(defaultFormValues);
    }
  }, [open, form]);

  async function handleNext() {
    const ok = await validateBlogPostStep(form, step);
    if (ok) setStep((s) => Math.min(s + 1, BLOG_POST_WIZARD_STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleComplete() {
    for (let i = 0; i < STEP_FIELDS.length; i++) {
      const ok = await validateBlogPostStep(form, i);
      if (!ok) {
        setStep(i);
        return;
      }
    }

    setSubmitting(true);
    const data = form.getValues();
    const res = await upsertBlogPost(
      { ...data, slug: data.slug || slugify(data.title) },
    );
    setSubmitting(false);

    if (res.success) {
      toast.success("Post criado");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <AdminWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Novo post"
      description="Crie um post para o blog em etapas."
      steps={BLOG_POST_WIZARD_STEPS}
      currentStep={step}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
      isSubmitting={submitting}
      completeLabel="Criar post"
    >
      <BlogPostFormFields form={form} step={step} categories={categories} tags={tags} />
    </AdminWizardDialog>
  );
}

export function BlogPostEditWizard({
  post,
  categories,
  tags,
  open,
  onOpenChange,
}: {
  post: BlogPostEditData;
  categories: BlogCategory[];
  tags: BlogTag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: postToFormValues(post),
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      setStep(0);
      form.reset(postToFormValues(post));
    }
  }, [open, post, form]);

  async function handleNext() {
    const ok = await validateBlogPostStep(form, step);
    if (ok) setStep((s) => Math.min(s + 1, BLOG_POST_WIZARD_STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleComplete() {
    for (let i = 0; i < STEP_FIELDS.length; i++) {
      const ok = await validateBlogPostStep(form, i);
      if (!ok) {
        setStep(i);
        return;
      }
    }

    setSubmitting(true);
    const data = form.getValues();
    const res = await upsertBlogPost(
      { ...data, slug: data.slug || slugify(data.title) },
      post.id,
    );
    setSubmitting(false);

    if (res.success) {
      toast.success("Post salvo");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <AdminWizardDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Editar post"
        description={post.title}
        steps={BLOG_POST_WIZARD_STEPS}
        currentStep={step}
        onNext={handleNext}
        onBack={handleBack}
        onComplete={handleComplete}
        isSubmitting={submitting}
        completeLabel="Salvar alterações"
        footerStart={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={submitting}
          >
            Excluir
          </Button>
        }
      >
        <BlogPostFormFields form={form} step={step} categories={categories} tags={tags} />
      </AdminWizardDialog>

      <AdminConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir post?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          const res = await deleteBlogPost(post.id);
          if (res.success) {
            toast.success("Post excluído");
            setConfirmDelete(false);
            onOpenChange(false);
            router.refresh();
          } else {
            toast.error(res.error);
          }
        }}
      />
    </>
  );
}

export function BlogPostForm({
  post,
  categories,
  tags,
}: {
  post?: PostWithTags;
  categories: BlogCategory[];
  tags: BlogTag[];
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      coverImage: post?.coverImage ?? "",
      published: post?.published ?? false,
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      categoryId: post?.categoryId ?? "",
      tagIds: post?.tags.map((t) => t.tag.id) ?? [],
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertBlogPost(
      { ...data, slug: data.slug || slugify(data.title) },
      post?.id,
    );
    if (res.success) {
      toast.success("Post salvo");
      router.push("/admin/blog");
      router.refresh();
    } else toast.error(res.error);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Título e slug
        </h2>
        <BlogPostFormFields form={form} step={0} categories={categories} tags={tags} />
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Conteúdo
        </h2>
        <BlogPostFormFields form={form} step={1} categories={categories} tags={tags} />
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Categoria e capa
        </h2>
        <BlogPostFormFields form={form} step={2} categories={categories} tags={tags} />
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          SEO e publicação
        </h2>
        <BlogPostFormFields form={form} step={3} categories={categories} tags={tags} />
      </section>
      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        {post && (
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            Excluir
          </Button>
        )}
      </div>

      {post && (
        <AdminConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Excluir post?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            const res = await deleteBlogPost(post.id);
            if (res.success) {
              toast.success("Post excluído");
              router.push("/admin/blog");
            } else toast.error(res.error);
          }}
        />
      )}
    </form>
  );
}
