"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Monitor, Smartphone } from "lucide-react";
import type { StorefrontBanner } from "@/lib/types/database";
import type { z } from "zod";
import { upsertBanner } from "@/actions/admin/banners";
import { bannerSchema } from "@/lib/validations/admin";
import {
  AdminWizardDialog,
  type WizardStep,
} from "@/components/admin/admin-wizard-dialog";
import { AdminWizardStep } from "@/components/admin/admin-wizard-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { AiImproveButton } from "@/components/admin/ai-improve-button";

type FormValues = z.infer<typeof bannerSchema>;

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "details",
    title: "Detalhes",
    description: "Informações básicas, link e período de exibição",
  },
  {
    id: "media",
    title: "Imagens",
    description: "Upload responsivo (Desktop, Tablet e Mobile)",
  },
  {
    id: "preview",
    title: "Preview",
    description: "Como o banner será exibido",
  },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["title", "link", "startDate", "endDate", "sortOrder", "active"],
  ["desktopImageUrl", "mobileImageUrl", "altText"],
  [],
];

function bannerToFormValues(banner?: StorefrontBanner): FormValues {
  return {
    title: banner?.title ?? "",
    desktopImageUrl: banner?.desktopImageUrl ?? "",
    mobileImageUrl: banner?.mobileImageUrl ?? "",
    altText: banner?.altText ?? "",
    link: banner?.link ?? "",
    sortOrder: banner?.sortOrder ?? 0,
    active: banner?.active ?? true,
    startDate: banner?.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : "",
    endDate: banner?.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
  };
}

export function BannerFormDialog({
  banner,
  trigger,
  defaultOpen = false,
  onClose,
}: {
  banner?: StorefrontBanner;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(banner);
  const draftId = useMemo(() => banner?.id ?? crypto.randomUUID(), [banner?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: bannerToFormValues(banner),
  });

  const resetForm = () => {
    form.reset(bannerToFormValues(banner));
    setStep(0);
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, banner]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep(0);
      onClose?.();
    }
  };

  const values = form.watch();

  const validateStep = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length === 0) return true;
    const ok = await form.trigger(fields);
    if (!ok) toast.error("Preencha os campos obrigatórios antes de continuar.");
    return ok;
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const res = await upsertBanner(data, banner?.id);
      if (res.success) {
        toast.success(isEdit ? "Banner atualizado" : "Banner criado");
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
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
            <Plus className="mr-1 h-4 w-4" />
            Novo banner
          </Button>
        )
      ) : null}

      <AdminWizardDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "Editar banner" : "Novo banner"}
        description="Slides do carrossel da página inicial"
        steps={WIZARD_STEPS}
        currentStep={step}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={() => void handleComplete()}
        completeLabel={isEdit ? "Salvar alterações" : "Criar banner"}
        isSubmitting={submitting}
      >
        {step === 0 && (
          <AdminWizardStep>
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Informações administrativas, links e controle de exibição do banner.
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="banner-title" className="after:content-['*'] after:ml-0.5 after:text-destructive">Título interno (admin)</Label>
                  <AiImproveButton
                    context="banner"
                    scope="title"
                    input={{ title: values.title ?? "" }}
                    disabled={!values.title?.trim()}
                    onImprove={(fields) => {
                      if (fields.title) form.setValue("title", fields.title, { shouldValidate: true });
                    }}
                  />
                </div>
                <Input
                  id="banner-title"
                  {...form.register("title")}
                  placeholder="Ex.: Promoção de Inverno"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="banner-link">Link ao clicar (opcional)</Label>
                <Input
                  id="banner-link"
                  {...form.register("link")}
                  placeholder="https://... ou /loja"
                />
                {form.formState.errors.link && (
                  <p className="text-xs text-destructive">{form.formState.errors.link.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="banner-start">Início da exibição (opcional)</Label>
                  <Input
                    id="banner-start"
                    type="datetime-local"
                    {...form.register("startDate")}
                  />
                  <p className="text-xs text-muted-foreground">Se vazio, exibe imediatamente.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="banner-end">Fim da exibição (opcional)</Label>
                  <Input
                    id="banner-end"
                    type="datetime-local"
                    {...form.register("endDate")}
                  />
                  <p className="text-xs text-muted-foreground">Se vazio, exibe até inativar.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="banner-sort">Ordem no carrossel</Label>
                  <Input
                    id="banner-sort"
                    type="number"
                    {...form.register("sortOrder", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">Menor número aparece primeiro.</p>
                </div>
                <label className="flex cursor-pointer flex-col justify-center gap-2 rounded-lg border px-4 py-2 mt-4 sm:mt-0">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      {...form.register("active")}
                    />
                    Ativo na vitrine
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    Desmarque para ocultar temporariamente.
                  </span>
                </label>
              </div>
            </div>
          </AdminWizardStep>
        )}

        {step === 1 && (
          <AdminWizardStep>
            <div className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="banner-alt">Texto alternativo (acessibilidade)</Label>
                <Input
                  id="banner-alt"
                  {...form.register("altText")}
                  placeholder="Descrição da imagem para leitores de tela"
                />
                <p className="text-xs text-muted-foreground">
                  Descreva o conteúdo da imagem para usuários com deficiência visual e SEO.
                </p>
                {form.formState.errors.altText && (
                  <p className="text-xs text-destructive">{form.formState.errors.altText.message}</p>
                )}
              </div>

              <ImageUploadField
                label="Imagem para Desktop (Principal)"
                description="Exibida em telas grandes e como padrão. Foco na qualidade visual."
                value={values.desktopImageUrl}
                onChange={(url) => form.setValue("desktopImageUrl", url, { shouldValidate: true })}
                entityId={draftId}
                kind="banner"
                deviceType="desktop"
                required
                aspectRatio="21/9"
                recommendedSize={{
                  width: 1920,
                  height: 823,
                  label: "1920 x 823 px (21:9) - Máx 8MB"
                }}
                error={form.formState.errors.desktopImageUrl?.message}
              />

              <ImageUploadField
                label="Imagem para Mobile (Opcional)"
                description="Otimizada para smartphones. Evita que informações importantes sejam cortadas nas laterais."
                value={values.mobileImageUrl || ""}
                onChange={(url) => form.setValue("mobileImageUrl", url, { shouldValidate: true })}
                entityId={draftId}
                kind="banner"
                deviceType="mobile"
                aspectRatio="16/9"
                recommendedSize={{
                  width: 750,
                  height: 422,
                  label: "750 x 422 px (16:9) - Máx 8MB"
                }}
                error={form.formState.errors.mobileImageUrl?.message}
              />
            </div>
          </AdminWizardStep>
        )}

        {step === 2 && (
          <AdminWizardStep>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preview Desktop</Label>
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted/30 shadow-sm">
                  {values.desktopImageUrl ? (
                    <img
                      src={values.desktopImageUrl}
                      alt={values.altText || values.title || "Banner"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem imagem para Desktop
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preview Mobile (Simulação 375px)</Label>
                <div className="relative aspect-[16/9] w-full max-w-[375px] mx-auto overflow-hidden rounded-lg border bg-muted/30 shadow-sm">
                  {values.mobileImageUrl || values.desktopImageUrl ? (
                    <img
                      src={values.mobileImageUrl || values.desktopImageUrl}
                      alt={values.altText || values.title || "Banner"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>
                {!values.mobileImageUrl && values.desktopImageUrl && (
                  <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-1">
                    Usando imagem de desktop (pode ser cortada no dispositivo real)
                  </p>
                )}
              </div>
            </div>
          </AdminWizardStep>
        )}
      </AdminWizardDialog>
    </>
  );
}
