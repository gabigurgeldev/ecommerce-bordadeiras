"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BlogAiCompareDialog({
  open,
  onOpenChange,
  title,
  before,
  after,
  afterIsHtml,
  loading,
  onAccept,
  onAcceptAndEdit,
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  before: string;
  after: string;
  afterIsHtml?: boolean;
  loading?: boolean;
  onAccept: () => void;
  onAcceptAndEdit: () => void;
  onReject: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Compare o texto original com a sugestão da IA antes de aplicar.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Processando com IA…
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Antes</p>
              <div className="h-56 overflow-y-auto rounded-md border bg-muted/20 p-3">
                <p className="whitespace-pre-wrap text-sm">{before || "—"}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Depois</p>
              <div className="h-56 overflow-y-auto rounded-md border bg-primary/5 p-3">
                {afterIsHtml && after ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: after }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{after || "—"}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onReject} disabled={loading}>
            Rejeitar
          </Button>
          <Button type="button" variant="secondary" onClick={onAcceptAndEdit} disabled={loading || !after}>
            Aceitar e editar
          </Button>
          <Button type="button" onClick={onAccept} disabled={loading || !after}>
            Aceitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
