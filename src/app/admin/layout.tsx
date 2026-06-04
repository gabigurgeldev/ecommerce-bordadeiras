import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Ecommerce Bordadeiras",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  let dbAvailable = true;
  try {
    dbAvailable = await isDatabaseAvailable();
  } catch {
    dbAvailable = false;
  }

  if (!dbAvailable) {
    return (
      <AdminShell>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Banco de dados indisponível</h1>
            <p className="text-sm text-muted-foreground">
              Não foi possível conectar ao Supabase. Verifique{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>, depois
              recarregue esta página.
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
