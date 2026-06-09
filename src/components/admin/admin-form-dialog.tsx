"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "lg";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          size === "lg"
            ? "flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0"
            : "flex max-h-[90vh] max-w-lg flex-col gap-0 p-0 sm:max-w-lg"
        }
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
