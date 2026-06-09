import { cn } from "@/lib/utils";

type ProductSectionCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function ProductSectionCard({
  title,
  description,
  action,
  children,
  className,
  id,
}: ProductSectionCardProps) {
  return (
    <section id={id} className={cn("rounded-lg border bg-card p-4 sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
