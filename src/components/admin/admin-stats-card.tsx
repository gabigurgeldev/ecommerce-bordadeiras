import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminStatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  href,
  className,
  highlight,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
  className?: string;
  highlight?: boolean;
}) {
  const content = (
    <Card
      className={cn(
        "border shadow-sm transition-shadow",
        highlight && "border-primary/20 bg-card",
        href && "hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("font-bold tracking-tight", highlight ? "text-3xl" : "text-2xl")}>
          {value}
        </div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    );
  }
  return content;
}
