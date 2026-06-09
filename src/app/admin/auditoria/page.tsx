import { listAuditLogs } from "@/actions/admin/dashboard";
import { PageHeader } from "@/components/admin/page-header";
import { AuditLogsList } from "@/components/admin/audit-logs-list";

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <PageHeader title="Auditoria" description="Registro de ações sensíveis no admin" />
      <AuditLogsList
        logs={logs.map((log) => ({
          id: log.id as string,
          action: log.action as string,
          entity: log.entity as string,
          entityId: (log.entityId as string | null) ?? null,
          userEmail: (log.userEmail as string | null) ?? null,
          createdAt: log.createdAt as string | Date,
        }))}
      />
    </div>
  );
}
