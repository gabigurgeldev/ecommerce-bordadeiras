import { getWhatsappStatus } from "@/actions/admin/settings";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "lucide-react";

export default async function AdminWhatsappPage() {
  const session = await getWhatsappStatus();

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Conexão via serviço Baileys (placeholder)"
      />
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>Sessão default do serviço externo</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={session.status === "connected" ? "default" : "secondary"}>
              {session.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Code</CardTitle>
            <CardDescription>Escaneie no app WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
            <QrCode className="h-24 w-24 opacity-40" />
            <p className="text-sm text-center max-w-xs">
              O QR será exibido aqui quando o serviço Baileys estiver em execução
              (<code className="text-xs">pnpm whatsapp:dev</code>).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
