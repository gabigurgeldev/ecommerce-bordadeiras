"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";
import { ImageIcon, Pencil, Plus } from "lucide-react";
import { categorySchema } from "@/lib/validations/admin";
import { upsertCategory, deleteCategory } from "@/actions/admin/categories";
import { AdminWizardDialog, type WizardStep } from "@/components/admin/admin-wizard-dialog";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AiImproveButton } from "@/components/admin/ai-improve-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { uploadImageViaApi } from "@/lib/upload-via-api";
import type { Category } from "@/lib/types/database";
import type { z } from "zod";

type FormValues = z.infer<typeof categorySchema>;

const WIZARD_STEPS: WizardStep[] = [
  { id: "basics", title: "Identificação", description: "Nome e endereço da página na loja" },
  { id: "content", title: "Conteúdo", description: "Descrição e imagem de capa" },
  { id: "seo", title: "SEO", description: "Como a categoria aparece nos buscadores" },
  { id: "organization", title: "Organização", description: "Hierarquia, ordenação e visibilidade" },
  { id: "review", title: "Revisão", description: "Confira antes de salvar" },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["name", "slug"],
  ["description", "imageUrl"],
  ["seoTitle", "seoDescription"],
  ["parentId", "sortOrder", "active"],
  [],
];

const SEO_TITLE_MAX = 70;
const SEO_DESC_MAX = 160;

function CategoryReviewSummary({
  values,
  parentName,
  imageUrl,
}: {
  values: FormValues;
  parentName: string | null;
  imageUrl: string;
}) {
  const effectiveTitle = values.seoTitle?.trim() || values.name;
  const effectiveDesc =
    values.seoDescription?.trim() ||
    values.description?.trim() ||
    `Explore produtos de ${values.name || "categoria"} na Bordadeiras.`;

  return (
    <dl className="divide-y rounded-lg border text-sm">
      <div className="flex gap-4 p-4">
        {imageUrl ? (
          <div className="relative aspect-[4/3] h-20 w-[calc(80px*4/3)] shrink-0 overflow-hidden rounded-md border">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="107px"
              unoptimized={imageUrl.startsWith("http://localhost")}
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] h-20 w-[calc(80px*4/3)] shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">Nome</dt>
            <dd className="font-medium">{values.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Endereço da página</dt>
            <dd className="font-mono text-muted-foreground">
              /loja/categoria/{values.slug || "—"}
            </dd>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Categoria pai</dt>
          <dd>{parentName ?? "Raiz (sem pai)"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ordem</dt>
          <dd>{values.sortOrder ?? 0}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd>{values.active ? "Ativa" : "Inativa"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Descrição</dt>
          <dd className="text-muted-foreground">{values.description || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Título SEO</dt>
          <dd>{effectiveTitle || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Descrição SEO</dt>
          <dd className="text-muted-foreground">{effectiveDesc || "—"}</dd>
        </div>
      </div>
    </dl>
  );
}

function SeoPreview({
  name,
  slug,
  description,
  seoTitle,
  seoDescription,
}: {
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const siteName = "Bordadeiras";
  const title = seoTitle?.trim() || name || "Nome da categoria";
  const snippet =
    seoDescription?.trim() ||
    description?.trim() ||
    `Explore produtos de ${name || "categoria"} na ${siteName}. Encontre o que precisa para suas bordadeiras.`;

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Prévia nos resultados de busca
      </p>
      <div className="space-y-1 rounded-md bg-background p-3 shadow-sm">
        <p className="truncate text-base text-[#1a0dab]">{title}</p>
        <p className="truncate text-sm text-[#006621]">
          loja.exemplo.com.br/loja/categoria/{slug || "slug-da-categoria"}
        </p>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{snippet}</p>
      </div>
    </div>
  );
}

function categoryToFormValues(category?: Category): FormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? "",
    seoTitle: category?.seoTitle ?? "",
    seoDescription: category?.seoDescription ?? "",
    parentId: category?.parentId ?? "",
    sortOrder: category?.sortOrder ?? 0,
    active: category?.active ?? true,
  };
}

export function CategoryFormDialog({
  category,
  categories = [],
  trigger,
  defaultOpen = false,
  onClose,
}: {
  category?: Category;
  categories?: Category[];
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const isEdit = Boolean(category);
  const [step, setStep] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [uploading, setUploading] = useState(false);
  const slugManualRef = useRef(false);
  const draftId = useMemo(() => category?.id ?? crypto.randomUUID(), [category?.id]);

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryToFormValues(category),
  });

  useEffect(() => {
    if (open) {
      setStep(0);
      setSlugManual(!!category?.slug);
      slugManualRef.current = !!category?.slug;
      form.reset(categoryToFormValues(category));
    }
  }, [open, category, form]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep(0);
      onClose?.();
    }
  };

  const values = form.watch();
  const imageUrl = values.imageUrl ?? "";
  const parentName = values.parentId
    ? parentOptions.find((c) => c.id === values.parentId)?.name ?? null
    : null;
  const effectiveSlug = values.slug || slugify(values.name);

  function handleNameChange(name: string) {
    form.setValue("name", name);
    if (!slugManualRef.current) {
      form.setValue("slug", slugify(name), { shouldValidate: name.length >= 2 });
    }
  }

  function enableManualSlug() {
    slugManualRef.current = true;
    setSlugManual(true);
  }

  async function validateStep(): Promise<boolean> {
    const fields = STEP_FIELDS[step];
    if (fields.length === 0) return true;
    const ok = await form.trigger(fields);
    if (!ok) toast.error("Preencha os campos obrigatórios antes de continuar.");
    return ok;
  }

  const handleNext = async () => {
    const ok = await validateStep();
    if (ok) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = {
      ...data,
      slug: data.slug || slugify(data.name),
      parentId: data.parentId || null,
      imageUrl: data.imageUrl || "",
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
    };
    const res = await upsertCategory(payload, category?.id);
    if (res.success) {
      toast.success(isEdit ? "Categoria atualizada" : "Categoria criada");
      handleOpenChange(false);
      router.refresh();
    } else toast.error(res.error);
  });

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : !defaultOpen ? (
        isEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova categoria
          </Button>
        )
      ) : null}

      <AdminWizardDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "Editar categoria" : "Nova categoria"}
        description="Organize o catálogo da loja em etapas"
        steps={WIZARD_STEPS}
        currentStep={step}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={() => void onSubmit()}
        isSubmitting={form.formState.isSubmitting || uploading}
        completeLabel={isEdit ? "Salvar alterações" : "Criar categoria"}
        footerStart={
          isEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
            </Button>
          ) : undefined
        }
      >
        <form id="category-wizard-form" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Nome da categoria *</Label>
                <Input
                  id="cat-name"
                  value={values.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Linhas e fios"
                />
                <p className="text-xs text-muted-foreground">
                  Nome exibido na loja e nos menus
                </p>
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-slug">Endereço da página *</Label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted-foreground">/loja/categoria/</span>
                  <Input
                    id="cat-slug"
                    {...form.register("slug", {
                      onChange: () => {
                        slugManualRef.current = true;
                        setSlugManual(true);
                      },
                    })}
                    placeholder="linhas-e-fios"
                    className="font-mono"
                    readOnly={!slugManual}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Parte da URL da categoria. Ex.:{" "}
                  <span className="font-mono">linhas-e-fios</span> vira{" "}
                  <span className="font-mono">/loja/categoria/linhas-e-fios</span>
                </p>
                {effectiveSlug && (
                  <p className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs text-muted-foreground">
                    /loja/categoria/{effectiveSlug}
                  </p>
                )}
                {!slugManual && values.name && (
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                    onClick={enableManualSlug}
                  >
                    Editar manualmente
                  </button>
                )}
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="cat-desc">Descrição</Label>
                  <AiImproveButton
                    context="category"
                    scope="description"
                    input={{ name: values.name, description: values.description ?? "" }}
                    disabled={!values.name?.trim()}
                    onImprove={(fields) => {
                      if (fields.description) {
                        form.setValue("description", fields.description, { shouldValidate: true });
                      }
                    }}
                  />
                </div>
                <Textarea
                  id="cat-desc"
                  rows={4}
                  {...form.register("description")}
                  placeholder="Breve descrição exibida na loja…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-upload">Imagem de capa</Label>
                <Input
                  id="cat-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const url = await uploadImageViaApi(file, "category", draftId);
                      if (url) {
                        form.setValue("imageUrl", url, { shouldValidate: true });
                        toast.success("Imagem enviada");
                      } else toast.error("Falha no upload");
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Proporção recomendada 4:3 (ex.: 1200×900 px). JPEG, PNG, WebP ou GIF. Máx. 8 MB.
                </p>
                {form.formState.errors.imageUrl && (
                  <p className="text-xs text-destructive">{form.formState.errors.imageUrl.message}</p>
                )}
              </div>
              {imageUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-lg border">
                    <Image
                      src={imageUrl}
                      alt="Prévia da imagem"
                      fill
                      className="object-cover"
                      sizes="320px"
                      unoptimized={imageUrl.startsWith("http://localhost")}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("imageUrl", "", { shouldValidate: true })}
                  >
                    Remover imagem
                  </Button>
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-50" aria-hidden />
                  <span className="text-xs">Prévia aparecerá após enviar a imagem</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <AiImproveButton
                    context="category"
                    scope="seo"
                    input={{
                      name: values.name,
                      description: values.description ?? "",
                      seoTitle: values.seoTitle ?? "",
                      seoDescription: values.seoDescription ?? "",
                    }}
                    disabled={!values.name?.trim()}
                    onImprove={(fields) => {
                      if (fields.seoTitle) {
                        form.setValue("seoTitle", fields.seoTitle, { shouldValidate: true });
                      }
                      if (fields.seoDescription) {
                        form.setValue("seoDescription", fields.seoDescription, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cat-seo-title">Título para buscadores</Label>
                    <span className="text-xs text-muted-foreground">
                      {(values.seoTitle ?? "").length}/{SEO_TITLE_MAX}
                    </span>
                  </div>
                  <Input
                    id="cat-seo-title"
                    maxLength={SEO_TITLE_MAX}
                    placeholder={values.name || "Título para buscadores"}
                    {...form.register("seoTitle")}
                  />
                  {form.formState.errors.seoTitle && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.seoTitle.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cat-seo-desc">Descrição para buscadores</Label>
                    <span className="text-xs text-muted-foreground">
                      {(values.seoDescription ?? "").length}/{SEO_DESC_MAX}
                    </span>
                  </div>
                  <Textarea
                    id="cat-seo-desc"
                    rows={3}
                    maxLength={SEO_DESC_MAX}
                    placeholder={
                      values.description?.trim() || "Descrição exibida nos resultados de busca…"
                    }
                    {...form.register("seoDescription")}
                  />
                  {form.formState.errors.seoDescription && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.seoDescription.message}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se vazio, usa o nome e a descrição da categoria automaticamente.
                </p>
              </div>
              <SeoPreview
                name={values.name}
                slug={effectiveSlug}
                description={values.description}
                seoTitle={values.seoTitle}
                seoDescription={values.seoDescription}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-parent">Categoria pai</Label>
                <select
                  id="cat-parent"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  {...form.register("parentId")}
                >
                  <option value="">Nenhuma (raiz)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Ordem de exibição</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    {...form.register("sortOrder", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">Menor número aparece primeiro</p>
                </div>
                <label className="flex items-end gap-2 pb-1 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    {...form.register("active")}
                  />
                  Categoria ativa na loja
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <CategoryReviewSummary
              values={values}
              parentName={parentName}
              imageUrl={imageUrl}
            />
          )}
        </form>
      </AdminWizardDialog>

      {isEdit && category && (
        <AdminConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir categoria?"
          description="Esta ação não pode ser desfeita. Subcategorias podem ficar órfãs."
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            const res = await deleteCategory(category.id);
            if (res.success) {
              toast.success("Categoria excluída");
              setConfirmDelete(false);
              handleOpenChange(false);
              router.refresh();
            } else toast.error(res.error);
          }}
        />
      )}
    </>
  );
}
