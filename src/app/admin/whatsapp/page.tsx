import Link from "next/link";
import { getWhatsappStatus } from "@/actions/admin/settings";
import { listWhatsappRecipients } from "@/actions/admin/whatsapp-recipients";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsappConnectPanel } from "@/components/admin/whatsapp-connect-panel";
import { WhatsappRecipientsPanel } from "@/components/admin/whatsapp-recipients-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Settings, FileText } from "lucide-react";

export default async function AdminWhatsappPage() {
  const [session, recipients] = await Promise.all([
    getWhatsappStatus(),
    listWhatsappRecipients(),
  ]);

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Configure a integração com WhatsApp, gerencie destinatários e edite templates de mensagens."
      />

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Conexão</span>
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Destinatários</span>
            {recipients.filter((r) => r.active).length > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {recipients.filter((r) => r.active).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2" asChild>
            <Link href="/admin/whatsapp/templates">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <WhatsappConnectPanel initialStatus={session.status} />
            
            {/* Quick link to templates */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Templates de Mensagens
                </CardTitle>
                <CardDescription>
                  Personalize as mensagens automáticas enviadas para clientes e vendedores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Edite os templates de mensagens que são enviadas automaticamente quando:
                </p>
                <ul className="text-sm space-y-1.5 text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Um novo pedido é criado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Pagamento é aprovado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Pedido é enviado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Pedido é entregue
                  </li>
                </ul>
                <Link href="/admin/whatsapp/templates">
                  <Button className="w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerenciar Templates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <WhatsappConnectPanel initialStatus={session.status} />
            <WhatsappRecipientsPanel
              recipients={recipients}
              whatsappConnected={session.status === "connected"}
            />
          </div>
        </TabsContent>

        <TabsContent value="templates">
          {/* This tab navigates to a separate page */}
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Redirecionando para página de templates...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}