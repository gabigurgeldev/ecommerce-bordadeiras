import { listAuditLogs } from "@/actions/admin/dashboard";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <PageHeader title="Auditoria" description="Registro de ações sensíveis no admin" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell>
                  {log.entity}
                  {log.entityId && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      {log.entityId.slice(-6)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{log.userEmail ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
