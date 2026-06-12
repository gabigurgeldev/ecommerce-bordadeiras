"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderTree,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/blog", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/blog/posts", label: "Posts", icon: FileText },
  { href: "/admin/blog/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/blog/comentarios", label: "Comentários", icon: MessageSquare },
];

export function BlogNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Button asChild size="sm" className="shrink-0">
        <Link href="/admin/blog/posts/create">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo post
        </Link>
      </Button>
    </div>
  );
}
