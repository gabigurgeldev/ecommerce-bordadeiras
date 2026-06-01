import { cn } from "@/lib/utils";
import Link from "next/link";

const steps = [
  { href: "/checkout", label: "Identificação" },
  { href: "/checkout/endereco", label: "Endereço" },
  { href: "/checkout/pagamento", label: "Pagamento" },
  { href: "/checkout/confirmacao", label: "Confirmação" },
];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="mb-10 flex flex-wrap gap-2 text-sm">
      {steps.map((step, i) => (
        <li key={step.href} className="flex items-center gap-2">
          <Link
            href={step.href}
            className={cn(
              "rounded-full px-3 py-1",
              i <= current
                ? "bg-rose-500 text-white"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            {i + 1}. {step.label}
          </Link>
          {i < steps.length - 1 && (
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
          )}
        </li>
      ))}
    </ol>
  );
}
