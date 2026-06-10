"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Info } from "lucide-react";
import type { WhatsappTemplate, WhatsappTemplateEvent, WhatsappTemplateRecipientType } from "@/lib/types/database";
import { whatsappTemplateSchema } from "@/lib/validations/admin";
import {
  updateWhatsappTemplate,
  resetTemplateToDefault,
  getTemplateVariables,
} from "@/actions/admin/whatsapp-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsappTemplatePreview } from "./whatsapp-template-preview";
import { AdminConfirmDialog } from "./admin-confirm-dialog";

type FormValues = z.infer<typeof whatsappTemplateSchema>;

const EVENT_OPTIONS: { value: WhatsappTemplateEvent; label: string }[] = [
  { value: "NEW_ORDER", label: "Novo Pedido" },
  { value: "PAYMENT_APPROVED", label: "Pagamento Aprovado" },
  { value: "ORDER_PROCESSING", label: "Pedido em Preparação" },
  { value: "ORDER_SHIPPED", label: "Pedido Enviado" },
  { value: "ORDER_DELIVERED", label: "Pedido Entregue" },
  { value: "ORDER_CANCELLED", label: "Pedido Cancelado" },
];

const RECIPIENT_OPTIONS: { value: WhatsappTemplateRecipientType; label: string }[] = [
  { value: "CUSTOMER", label: "Cliente" },
  { value: "ADMIN", label: "Vendedor/Admin" },
];

interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

interface WhatsappTemplateFormProps {
  template: WhatsappTemplate;
  variables?: TemplateVariable[];
}

export function WhatsappTemplateForm({ template, variables = [] }: WhatsappTemplateFormProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(whatsappTemplateSchema),
    defaultValues: {
      key: template.key,
      name: template.name,
      template: template.template,
      recipientType: template.recipientType,
      event: template.event,
      active: template.active,
    },
  });

  const templateContent = form.watch("template");
  const isSubmitting = form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;
  const isDefault = template.isDefault;

  async function onSubmit(data: FormValues) {
    const res = await updateWhatsappTemplate(template.key, data);
    if (res.success) {
      toast.success("Template atualizado com sucesso");
      form.reset(data);
    } else {
      toast.error(res.error || "Erro ao atualizar template");
    }
  }

  async function handleReset() {
    setIsResetting(true);
    const res = await resetTemplateToDefault(template.key);
    if (res.success) {
      toast.success("Template restaurado para o padrão");
      router.refresh();
    } else {
      toast.error(res.error || "Erro ao restaurar template");
    }
    setIsResetting(false);
    setShowResetConfirm(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Editar Template</CardTitle>
              <CardDescription className="text-xs">
                Chave: <code className="text-xs bg-muted px-1 rounded">{template.key}</code>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Padrão
                </Badge>
              )}
              <Badge variant={template.active ? "default" : "secondary"} className="text-xs">
                {template.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Event and Recipient Type (read-only for default templates) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event">Evento</Label>
                  <Select
                    value={form.watch("event")}
                    onValueChange={(v) => form.setValue("event", v as WhatsappTemplateEvent)}
                    disabled={isDefault}
                  >
                    <SelectTrigger id="event">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isDefault && (
                    <p className="text-xs text-muted-foreground">
                      Não editável em templates padrão
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientType">Destinatário</Label>
                  <Select
                    value={form.watch("recipientType")}
                    onValueChange={(v) =>
                      form.setValue("recipientType", v as WhatsappTemplateRecipientType)
                    }
                    disabled={isDefault}
                  >
                    <SelectTrigger id="recipientType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECIPIENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isDefault && (
                    <p className="text-xs text-muted-foreground">
                      Não editável em templates padrão
                    </p>
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="active" className="text-sm font-medium">
                    Template Ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mensagens só são enviadas se o template estiver ativo
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked)}
                />
              </div>

              {/* Template content */}
              <div className="space-y-2">
                <Label htmlFor="template">Conteúdo da Mensagem</Label>
                <Textarea
                  id="template"
                  {...form.register("template")}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Digite o conteúdo do template com as variáveis {{orderId}}, {{customerName}}, etc."
                />
                {form.formState.errors.template && (
                  <p className="text-xs text-red-500">{form.formState.errors.template.message}</p>
                )}
              </div>

              {/* Variables reference */}
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    Variáveis Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid gap-1 text-xs">
                    {variables.length > 0 ? (
                      variables.map((v) => (
                        <div
                          key={v.key}
                          className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                        >
                          <code className="text-primary bg-primary/10 px-1 rounded">{v.key}</code>
                          <span className="text-muted-foreground">{v.description}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-1 border-b border-border/50">
                          <code className="text-primary bg-primary/10 px-1 rounded">{"{{orderId}}"}</code>
                          <span className="text-muted-foreground">ID do pedido</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/50">
                          <code className="text-primary bg-primary/10 px-1 rounded">{"{{customerName}}"}</code>
                          <span className="text-muted-foreground">Nome do cliente</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/50">
                          <code className="text-primary bg-primary/10 px-1 rounded">{"{{amount}}"}</code>
                          <span className="text-muted-foreground">Valor formatado (R$)</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/50">
                          <code className="text-primary bg-primary/10 px-1 rounded">{"{{trackingCode}}"}</code>
                          <span className="text-muted-foreground">Código de rastreio</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                disabled={isResetting || !isDefault}
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restaurar Padrão
              </Button>

              <Button type="submit" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="space-y-4">
        <WhatsappTemplatePreview
          template={templateContent}
          variables={variables}
          recipientType={form.watch("recipientType")}
        />
      </div>

      {/* Reset confirmation */}
      <AdminConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Restaurar template padrão?"
        description="As alterações personalizadas serão perdidas e o template voltará ao conteúdo original."
        confirmLabel="Restaurar"
        destructive
        onConfirm={handleReset}
      />
    </div>
  );
}