"use client";

import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/actions/admin/_utils";

export function CsvStubButtons({
  onExport,
  onImport,
}: {
  onExport: () => Promise<ActionResult<{ message: string }>>;
  onImport: () => Promise<ActionResult<{ message: string }>>;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const res = await onExport();
          toast.info(res.success ? res.data?.message : res.error);
        }}
      >
        <Download className="mr-2 h-4 w-4" />
        Exportar CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const res = await onImport();
          toast.info(res.success ? res.data?.message : res.error);
        }}
      >
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </Button>
    </>
  );
}
