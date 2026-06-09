"use client";

import { createContext, useContext } from "react";

type AdminContextValue = {
  adminEmail: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  adminEmail,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileNavOpen,
  setMobileNavOpen,
  children,
}: AdminContextValue & { children: React.ReactNode }) {
  return (
    <AdminContext.Provider
      value={{ adminEmail, sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminShell() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminProvider");
  return ctx;
}
