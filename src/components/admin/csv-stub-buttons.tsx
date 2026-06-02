"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/actions/admin/_utils";

export function CsvExportButton({
  onExport,
}: {
  onExport: () => Promise<ActionResult<{ csv: string; filename: string }>>;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const res = await onExport();
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        const { csv, filename } = res.data!;
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exportado");
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
