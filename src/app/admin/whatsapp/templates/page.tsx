import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageSquare, User, Users } from "lucide-react";
import { listWhatsappTemplates, getTemplateVariables } from "@/actions/admin/whatsapp-templates";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsappTemplateForm } from "@/components/admin/whatsapp-template-form";
import type { WhatsappTemplate, WhatsappTemplateEvent, WhatsappTemplateRecipientType } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Templates WhatsApp | Admin",
  description: "Gerenciar templates de mensagens automáticas do WhatsApp",
};

const EVENT_LABELS: Record<WhatsappTemplateEvent, string> = {
  NEW_ORDER: "Novo Pedido",
  PAYMENT_APPROVED: "Pagamento Aprovado",
  ORDER_PROCESSING: "Pedido em Preparação",
  ORDER_SHIPPED: "Pedido Enviado",
  ORDER_DELIVERED: "Pedido Entregue",
  ORDER_CANCELLED: "Pedido Cancelado",
  PENDING_PAYMENT: "Cobrança Pendente",
  ABANDONED_CART: "Sacola Abandonada",
  CUSTOM_OUTREACH: "Contato Personalizado",
};

const RECIPIENT_LABELS: Record<WhatsappTemplateRecipientType, { label: string; icon: React.ReactNode }> = {
  CUSTOMER: { label: "Cliente", icon: <User className="h-3 w-3" /> },
  ADMIN: { label: "Vendedor", icon: <Users className="h-3 w-3" /> },
};

function TemplateCard({
  template,
  variables,
}: {
  template: WhatsappTemplate;
  variables: { key: string; description: string; example: string }[];
}) {
  const recipient = RECIPIENT_LABELS[template.recipientType];

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-medium truncate">{template.name}</CardTitle>
              {template.isDefault && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Padrão
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              <code className="text-xs bg-muted px-1 rounded">{template.key}</code>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant={template.active ? "default" : "secondary"}
              className="text-[10px]"
            >
              {template.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px]">
            {EVENT_LABELS[template.event]}
          </Badge>
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            {recipient.icon}
            {recipient.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <WhatsappTemplateForm template={template} variables={variables} />
      </CardContent>
    </Card>
  );
}

export default async function AdminWhatsappTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [templates, variables] = await Promise.all([
    listWhatsappTemplates(),
    getTemplateVariables(),
  ]);

  const params = await searchParams;
  const activeTab = (params.tab as string) || "all";

  // Filter templates
  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((t) => t.event === activeTab);

  return (
    <div>
      <PageHeader
        title="Templates WhatsApp"
        description="Edite as mensagens automáticas enviadas para clientes e vendedores."
        actions={
          <Link href="/admin/whatsapp">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Info card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Os templates são usados para formatar as mensagens automáticas enviadas via WhatsApp.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Templates <strong>padrão</strong> não podem ser excluídos, apenas editados</li>
                  <li>Use as variáveis {"{{"}orderId{"}}"}, {"{{"}customerName{"}}"}, {"{{"}amount{"}}"}, etc.</li>
                  <li>Mensagens só são enviadas se o template estiver ativo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all" asChild>
              <Link href="/admin/whatsapp/templates?tab=all">Todos</Link>
            </TabsTrigger>
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key} asChild>
                <Link href={`/admin/whatsapp/templates?tab=${key}`}>{label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Templates grid */}
          <div className="grid gap-6">
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Nenhum template encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  variables={variables}
                />
              ))
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}