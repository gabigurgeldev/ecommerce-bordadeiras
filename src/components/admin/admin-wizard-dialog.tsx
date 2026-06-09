"use client";

import { Check } from "lucide-react";
import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title?: string;
  label?: string;
  description?: string;
};

/** @deprecated use WizardStep */
export type AdminWizardStep = WizardStep;

function stepLabel(step: WizardStep) {
  return step.title ?? step.label ?? step.id;
}

type AdminWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: WizardStep[];
  currentStep: number;
  onNext?: () => void | boolean | Promise<void | boolean>;
  onBack?: () => void;
  onComplete?: () => void | Promise<void>;
  onFinish?: () => void | Promise<void>;
  children: React.ReactNode;
  isSubmitting?: boolean;
  completeLabel?: string;
  finishLabel?: string;
  footer?: React.ReactNode;
  footerStart?: React.ReactNode;
  onStepChange?: (step: number) => void;
  canProceed?: boolean;
};

export function AdminWizardDialog({
  open,
  onOpenChange,
  title,
  description,
  steps,
  currentStep,
  onNext,
  onBack,
  onComplete,
  onFinish,
  children,
  isSubmitting = false,
  completeLabel,
  finishLabel,
  footer,
  footerStart,
  onStepChange,
  canProceed = true,
}: AdminWizardDialogProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const handleComplete = onComplete ?? onFinish;
  const submitLabel = completeLabel ?? finishLabel ?? "Concluir";

  const handleNextClick = async () => {
    if (!onNext) {
      if (onStepChange) onStepChange(Math.min(currentStep + 1, steps.length - 1));
      return;
    }
    const result = await onNext();
    if (result === false) return;
    if (onStepChange) onStepChange(Math.min(currentStep + 1, steps.length - 1));
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (onStepChange) onStepChange(Math.max(currentStep - 1, 0));
  };

  const defaultFooter = (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {footerStart}
        <ol className="flex flex-wrap items-center gap-1.5">
          {steps.map((s, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            return (
              <li key={s.id} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span
                    className={cn(
                      "hidden h-px w-4 sm:block",
                      done ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex h-7 min-w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && !done && "border-primary text-primary",
                    !done && !active && "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs sm:inline",
                    active ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {stepLabel(s)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        {!isFirst && (
          <Button type="button" variant="outline" onClick={handleBackClick} disabled={isSubmitting}>
            Voltar
          </Button>
        )}
        {isLast ? (
          <Button
            type="button"
            onClick={() => void handleComplete?.()}
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? "Salvando…" : submitLabel}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleNextClick()}
            disabled={isSubmitting || !canProceed}
          >
            Próximo
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="lg"
      footer={footer ?? defaultFooter}
    >
      <div className="mb-5 space-y-1">
        <p className="text-sm font-medium">{stepLabel(step)}</p>
        {step.description && (
          <p className="text-sm text-muted-foreground">{step.description}</p>
        )}
      </div>
      {children}
    </AdminFormDialog>
  );
}
