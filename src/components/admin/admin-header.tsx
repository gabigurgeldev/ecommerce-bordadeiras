"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { brandAssets } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminOrderNotifications } from "@/components/admin/admin-order-notifications";
import { getAdminBreadcrumbs } from "@/lib/admin-route-meta";
import { useAdminShell } from "@/components/admin/admin-context";
import { cn } from "@/lib/utils";

function getInitials(email: string) {
  const local = email.split("@")[0] ?? "A";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function AdminHeader() {
  const pathname = usePathname();
  const { adminEmail, sidebarCollapsed, setSidebarCollapsed, setMobileNavOpen } = useAdminShell();
  const crumbs = getAdminBreadcrumbs(pathname);
  const initials = getInitials(adminEmail);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 md:gap-3 md:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-controls="admin-mobile-nav"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      <Link
        href="/admin"
        className="flex shrink-0 items-center md:hidden"
        aria-label="Bordadeiras — Painel admin"
      >
        <Image
          src={brandAssets.logoIcon}
          alt={brandAssets.alt}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
      </Link>

      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap overflow-x-auto text-xs sm:text-sm">
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="shrink-0">
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <AdminOrderNotifications />

      <div
        className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-2.5"
        title={adminEmail}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground",
          )}
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:inline">
          {adminEmail}
        </span>
      </div>
    </header>
  );
}
