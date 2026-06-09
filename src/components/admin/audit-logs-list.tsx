"use client";

import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { AdminListToolbar, adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
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

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userEmail: string | null;
  createdAt: string | Date;
};

const actionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  SETTINGS_CHANGE: "Configuração",
};

export function AuditLogsList({ logs }: { logs: LogRow[] }) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const entities = useMemo(() => {
    const set = new Set(logs.map((l) => l.entity));
    return Array.from(set).sort();
  }, [logs]);

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (entityFilter !== "all" && l.entity !== entityFilter) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        (l.userEmail?.toLowerCase().includes(q) ?? false) ||
        (l.entityId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [logs, search, entityFilter, actionFilter]);

  if (logs.length === 0) {
    return (
      <AdminEmptyState
        icon={ScrollText}
        title="Nenhum registro de auditoria"
        description="Ações no admin serão registradas aqui."
      />
    );
  }

  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar ação, entidade ou usuário…"
        count={filtered.length}
        countLabel="registros"
        filters={
          <div className="flex flex-wrap gap-2">
            <select
              className={adminFilterSelectClass}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">Todas ações</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {actionLabels[a] ?? a}
                </option>
              ))}
            </select>
            <select
              className={adminFilterSelectClass}
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="all">Todas entidades</option>
              {entities.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        }
      />
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum registro corresponde aos filtros.
        </p>
      ) : (
        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden md:table-cell">Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{actionLabels[log.action] ?? log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.entity}</div>
                    {log.entityId && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.entityId.slice(0, 8)}…
                      </span>
                    )}
                    {log.userEmail && (
                      <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                        {log.userEmail}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {log.userEmail ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
