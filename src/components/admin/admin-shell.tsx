"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminThemeProvider } from "@/components/admin/admin-theme-provider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminShell({
  children,
  adminEmail = "admin",
}: {
  children: React.ReactNode;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setSidebarCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed, hydrated]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <AdminThemeProvider>
      <AdminProvider
        adminEmail={adminEmail}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      >
        <div className="flex min-h-screen w-full bg-muted/20">
          <div className="hidden md:block shrink-0">
            <div className="sticky top-0 h-screen">
              <AdminSidebar collapsed={sidebarCollapsed} />
            </div>
          </div>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="p-0 w-64" id="admin-mobile-nav">
              <SheetTitle className="sr-only">Menu admin</SheetTitle>
              <AdminSidebar onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <AdminPageContainer>{children}</AdminPageContainer>
            </main>
          </div>
        </div>
      </AdminProvider>
    </AdminThemeProvider>
  );
}
