"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { brandAssets } from "@/lib/brand";
import {
  adminNavTop,
  adminNavGroups,
  adminNavFooter,
  type AdminNavItem,
} from "@/components/admin/admin-nav-groups";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAdminShell } from "@/components/admin/admin-context";

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors min-h-[40px]",
        active
          ? collapsed
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-primary/12 font-medium text-primary border-l-2 border-primary pl-[10px]"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        collapsed && "justify-center px-2 border-l-0 pl-2",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function groupHasActive(pathname: string, items: AdminNavItem[]) {
  return items.some((item) => isActive(pathname, item.href));
}

export function AdminSidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileNavOpen } = useAdminShell();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const group of adminNavGroups) {
      next[group.id] = groupHasActive(pathname, group.items);
    }
    setOpenGroups((prev) => ({ ...next, ...prev }));
  }, [pathname]);

  async function handleSignOut() {
    const supabase = await getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    setMobileNavOpen(false);
    router.push("/login");
    router.refresh();
  }

  const handleNav = () => {
    onNavigate?.();
    setMobileNavOpen(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-card shadow-sm transition-[width] duration-200 ease-out",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border px-3",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          <Link
            href="/admin"
            onClick={handleNav}
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              collapsed && "justify-center",
            )}
            aria-label="Bordadeiras — Painel admin"
          >
            <Image
              src={collapsed ? brandAssets.logoIcon : brandAssets.logo}
              alt={brandAssets.alt}
              width={collapsed ? 36 : 120}
              height={collapsed ? 36 : 40}
              className={cn(
                "shrink-0 object-contain object-left",
                collapsed ? "h-9 w-9" : "h-9 w-auto max-w-[140px]",
              )}
              priority
            />
            {!collapsed && (
              <span className="hidden min-w-0 flex-col leading-tight xl:flex">
                <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </span>
            )}
          </Link>
          {!collapsed && <ThemeToggle />}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {adminNavTop.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={handleNav}
            />
          ))}

          {adminNavGroups.map((group) => {
            const groupActive = groupHasActive(pathname, group.items);
            if (collapsed) {
              return (
                <div key={group.id} className="space-y-1 pt-2">
                  <Separator className="mb-2" />
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(pathname, item.href)}
                      collapsed
                      onNavigate={handleNav}
                    />
                  ))}
                </div>
              );
            }
            return (
              <Collapsible
                key={group.id}
                open={openGroups[group.id] ?? groupActive}
                onOpenChange={(open) => setOpenGroups((p) => ({ ...p, [group.id]: open }))}
                className="pt-1"
              >
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 min-h-[36px]",
                    groupActive && "text-foreground",
                  )}
                >
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pl-1 pt-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(pathname, item.href)}
                      collapsed={false}
                      onNavigate={handleNav}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          <Separator className="my-2" />

          {adminNavFooter.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={handleNav}
            />
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-2">
          {collapsed && (
            <div className="flex justify-center pb-1">
              <ThemeToggle />
            </div>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="w-full"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 min-h-[40px]"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          )}
          {!collapsed && (
            <p className="px-1 text-[11px] text-muted-foreground truncate">Painel administrativo</p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
