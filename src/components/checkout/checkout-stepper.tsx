"use client";

import {
  Check,
  ShoppingCart,
  MapPin,
  User,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep =
  | "sacola"
  | "endereco"
  | "dados"
  | "pagamento"
  | "confirmacao";

const STEPS: {
  key: CheckoutStep;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "sacola", label: "Sacola", icon: ShoppingCart },
  { key: "endereco", label: "Endereço", icon: MapPin },
  { key: "dados", label: "Dados", icon: User },
  { key: "pagamento", label: "Pagamento", icon: CreditCard },
  { key: "confirmacao", label: "Confirmação", icon: CheckCircle2 },
];

export function CheckoutStepper({
  currentStep,
}: {
  currentStep: CheckoutStep;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Progresso do checkout" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                    isDone &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent &&
                      "border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-200",
                    !isDone && !isCurrent &&
                      "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isDone && "text-emerald-600",
                    isCurrent && "text-rose-600",
                    !isDone && !isCurrent && "text-zinc-400",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-2 mb-5 h-0.5 w-10 sm:w-16 transition-colors",
                    isDone ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
