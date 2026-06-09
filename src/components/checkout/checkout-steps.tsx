import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { label: "Identificação" },
  { label: "Endereço" },
  { label: "Pagamento" },
  { label: "Confirmação" },
];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Progresso do checkout" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    done
                      ? "border-[var(--color-brown)] bg-[var(--color-brown)] text-white"
                      : active
                        ? "border-[var(--color-cta)] bg-[var(--color-cta)] text-white"
                        : "border-[var(--color-card-border)] bg-white text-zinc-400",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] font-medium uppercase tracking-wide sm:block",
                    active
                      ? "text-[var(--color-cta)]"
                      : done
                        ? "text-[var(--color-brown)]"
                        : "text-zinc-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 transition-colors sm:mx-2",
                    i < current
                      ? "bg-[var(--color-brown)]"
                      : "bg-[var(--color-card-border)]",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
