import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Breadcrumb = ({ ...props }: React.ComponentProps<"nav">) => (
  <nav aria-label="Breadcrumb" {...props} />
);

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className,
    )}
    {...props}
  />
);

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />
);

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
);

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
);

const BreadcrumbLink = ({ className, ...props }: React.ComponentProps<"a">) => (
  <a className={cn("transition-colors hover:text-foreground", className)} {...props} />
);

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator };
