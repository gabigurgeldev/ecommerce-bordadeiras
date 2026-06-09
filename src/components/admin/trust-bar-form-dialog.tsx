"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { StorefrontTrustItem } from "@/lib/types/database";
import type { z } from "zod";
import { deleteTrustBarItem, upsertTrustBarItem } from "@/actions/admin/trust-bar";
import { trustBarItemSchema } from "@/lib/validations/admin";
import {
  TRUST_ICON_KEYS,
  TRUST_ICON_LABELS,
  getTrustIcon,
  type TrustIconKey,
} from "@/lib/trust-icons";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AiImproveButton } from "@/components/admin/ai-improve-button";
import { AdminWizardDialog } from "@/components/admin/admin-wizard-dialog";
import { AdminWizardStep } from "@/components/admin/admin-wizard-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof trustBarItemSchema>;

const WIZARD_STEPS = [
  {
    id: "content",
    title: "Ícone/texto",
    description: "Título, descrição e ícone exibidos na vitrine",
  },
  {
    id: "settings",
    title: "Ordem/ativo",
    description: "Posição na barra e visibilidade na loja",
  },
  {
    id: "review",
    title: "Revisão",
    description: "Confira como o item aparecerá na página inicial",
  },
] as const;

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["title", "description", "icon", "link"],
  ["sortOrder", "active"],
  [],
];

function IconPreview({
  iconKey,
  size = "md",
}: {
  iconKey: TrustIconKey;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = getTrustIcon(iconKey);
  const sizeClass =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20",
        sizeClass,
      )}
    >
      <Icon className={cn(iconSize, "text-primary")} weight="regular" aria-hidden />
    </span>
  );
}

function TrustItemPreview({
  title,
  description,
  iconKey,
  link,
  active,
  sortOrder,
}: {
  title: string;
  description: string;
  iconKey: TrustIconKey;
  link?: string;
  active: boolean;
  sortOrder: number;
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border bg-[#5c4332] p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#f5e9d8]/50">
          Como será exibido na loja
        </p>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5e9d8]/10 ring-1 ring-[#f5e9d8]/20">
            {(() => {
              const Icon = getTrustIcon(iconKey);
              return (
                <Icon className="h-6 w-6 text-[#f5e9d8]" weight="regular" aria-hidden />
              );
            })()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-tight text-[#faf6ef]">
              {title || "Título do item"}
            </p>
            <p className="mt-1 text-sm leading-snug text-[#f5e9d8]/80">
              {description || "Descrição do item"}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid gap-4 rounded-xl border bg-muted/30 p-5 text-sm sm:grid-cols-2 shadow-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Ícone</dt>
          <dd className="flex items-center gap-2 font-medium">
            <IconPreview iconKey={iconKey} size="sm" />
            {TRUST_ICON_LABELS[iconKey]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Ordem de exibição</dt>
          <dd className="font-medium text-base">{sortOrder}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Status</dt>
          <dd>
            <Badge variant={active ? "default" : "secondary"} className="px-2 py-0.5">
              {active ? "Ativo" : "Inativo"}
            </Badge>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Link de destino</dt>
          <dd className="font-mono text-xs break-all bg-background border rounded-md px-3 py-2 text-muted-foreground">
            {link?.trim() ? link : "Nenhum link configurado"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function TrustBarFormDialog({ item }: { item?: StorefrontTrustItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(item);

  const form = useForm<FormValues>({
    resolver: zodResolver(trustBarItemSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      icon: (item?.icon as TrustIconKey) ?? "badge-check",
      link: item?.link ?? "",
      sortOrder: item?.sortOrder ?? 0,
      active: item?.active ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: item?.title ?? "",
        description: item?.description ?? "",
        icon: (item?.icon as TrustIconKey) ?? "badge-check",
        link: item?.link ?? "",
        sortOrder: item?.sortOrder ?? 0,
        active: item?.active ?? true,
      });
      setStep(0);
    }
  }, [open, item, form]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStep(0);
  };

  const iconKey = form.watch("icon") as TrustIconKey;
  const watched = form.watch();

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
      const res = await upsertTrustBarItem(data, item?.id);
      if (res.success) {
        toast.success(isEdit ? "Item atualizado" : "Item criado");
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
      {isEdit ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Editar
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          Novo item
        </Button>
      )}

      <AdminWizardDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "Editar item" : "Novo item"}
        description="Barra de confiança abaixo do banner na página inicial"
        steps={[...WIZARD_STEPS]}
        currentStep={step}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={() => void handleComplete()}
        completeLabel={isEdit ? "Salvar alterações" : "Criar item"}
        isSubmitting={submitting}
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
        {step === 0 && (
          <AdminWizardStep>
            <div className="flex justify-end">
              <AiImproveButton
                context="trust-bar"
                scope="text"
                input={{
                  title: watched.title ?? "",
                  description: watched.description ?? "",
                }}
                disabled={!watched.title?.trim() && !watched.description?.trim()}
                onImprove={(fields) => {
                  if (fields.title) form.setValue("title", fields.title, { shouldValidate: true });
                  if (fields.description) {
                    form.setValue("description", fields.description, { shouldValidate: true });
                  }
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="trust-title" className="after:content-['*'] after:ml-0.5 after:text-destructive">Título</Label>
                <Input
                  id="trust-title"
                  {...form.register("title")}
                  placeholder="Ex.: Pagamento Seguro"
                  className="h-10"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <Label htmlFor="trust-description" className="after:content-['*'] after:ml-0.5 after:text-destructive">Descrição</Label>
                <Input
                  id="trust-description"
                  {...form.register("description")}
                  placeholder="Ex.: Ambiente protegido"
                  className="h-10"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Ícone</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <IconPreview iconKey={iconKey} size="lg" />
                <div className="flex-1">
                  <p className="text-base font-semibold">{TRUST_ICON_LABELS[iconKey]}</p>
                  <p className="text-sm text-muted-foreground">Ícone selecionado para exibição</p>
                </div>
              </div>
              
              <div className="rounded-xl border bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-3 px-1 uppercase tracking-wider">
                  Opções disponíveis
                </p>
                <div className="grid max-h-[240px] grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4 md:grid-cols-5 scrollbar-thin">
                  {TRUST_ICON_KEYS.map((key) => {
                    const Icon = getTrustIcon(key);
                    const selected = iconKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={TRUST_ICON_LABELS[key]}
                        onClick={() => form.setValue("icon", key, { shouldValidate: true })}
                        className={cn(
                          "group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200",
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                            : "border-border/50 bg-background hover:border-primary/40 hover:bg-muted hover:shadow-sm",
                        )}
                      >
                        <Icon 
                          className={cn(
                            "h-7 w-7 transition-transform duration-200",
                            selected ? "scale-110" : "group-hover:scale-110 text-muted-foreground group-hover:text-foreground"
                          )} 
                          weight={selected ? "fill" : "regular"} 
                          aria-hidden 
                        />
                        <span className={cn(
                          "line-clamp-2 text-[10px] font-medium leading-tight transition-colors",
                          selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {TRUST_ICON_LABELS[key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <Label htmlFor="trust-link">Link de redirecionamento (opcional)</Label>
              <Input
                id="trust-link"
                {...form.register("link")}
                placeholder="https://... ou /contato"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Deixe em branco se não quiser que o item seja clicável.</p>
              {form.formState.errors.link && (
                <p className="text-xs text-destructive">{form.formState.errors.link.message}</p>
              )}
            </div>
          </AdminWizardStep>
        )}

        {step === 1 && (
          <AdminWizardStep>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trust-order">Ordem de exibição</Label>
                <Input
                  id="trust-order"
                  type="number"
                  min={0}
                  className="max-w-xs h-10"
                  {...form.register("sortOrder", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Itens com menor número aparecem primeiro na barra (ex: 0, 1, 2...).
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  {...form.register("active")}
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-none">Ativo na vitrine</p>
                  <p className="text-xs text-muted-foreground">
                    Desmarque para ocultar este item temporariamente da página inicial sem precisar excluí-lo.
                  </p>
                </div>
              </label>
            </div>
          </AdminWizardStep>
        )}

        {step === 2 && (
          <AdminWizardStep>
            <TrustItemPreview
              title={watched.title}
              description={watched.description}
              iconKey={iconKey}
              link={watched.link}
              active={watched.active}
              sortOrder={watched.sortOrder}
            />
          </AdminWizardStep>
        )}
      </AdminWizardDialog>

      {item && (
        <AdminConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir item?"
          description={`"${item.title}" será removido permanentemente da barra de confiança.`}
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            const res = await deleteTrustBarItem(item.id);
            if (res.success) {
              toast.success("Item excluído");
              setConfirmDelete(false);
              handleOpenChange(false);
              router.refresh();
            } else {
              toast.error(res.error);
            }
          }}
        />
      )}
    </>
  );
}
