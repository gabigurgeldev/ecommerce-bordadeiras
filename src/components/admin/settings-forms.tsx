"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  mercadoPagoSettingsSchema,
  smtpSettingsSchema,
} from "@/lib/validations/admin";
import {
  saveMercadoPagoSettings,
  saveSmtpSettings,
  sendSmtpTest,
} from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { z } from "zod";

type MpValues = z.infer<typeof mercadoPagoSettingsSchema>;
type MpFormValues = MpValues & { hasAccessToken?: boolean; hasWebhookSecret?: boolean };
type SmtpValues = z.infer<typeof smtpSettingsSchema>;

export function SettingsTabs({
  mercadoPago,
  smtp,
  whatsapp,
}: {
  mercadoPago: MpFormValues;
  smtp: SmtpValues & { port: number | string };
  whatsapp: { status: string; updatedAt: Date | null };
}) {
  const mpForm = useForm<MpFormValues>({
    resolver: zodResolver(mercadoPagoSettingsSchema),
    defaultValues: mercadoPago,
  });

  const smtpForm = useForm<SmtpValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      ...smtp,
      port: Number(smtp.port) || 587,
    },
  });

  return (
    <Tabs defaultValue="mercadopago">
      <TabsList>
        <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="smtp">SMTP</TabsTrigger>
      </TabsList>

      <TabsContent value="mercadopago">
        <form
          className="max-w-lg space-y-4"
          onSubmit={mpForm.handleSubmit(async (data) => {
            const res = await saveMercadoPagoSettings(data);
            if (res.success) toast.success("Mercado Pago salvo");
            else toast.error(res.error);
          })}
        >
          <div className="space-y-2">
            <Label>Public Key</Label>
            <Input {...mpForm.register("publicKey")} />
          </div>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              placeholder={
                mercadoPago.hasAccessToken
                  ? "•••••••• (deixe em branco para manter)"
                  : "Cole o Access Token de produção"
              }
              {...mpForm.register("accessToken")}
            />
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input
              type="password"
              placeholder={
                mercadoPago.hasWebhookSecret
                  ? "•••••••• (deixe em branco para manter)"
                  : "Secret do webhook Mercado Pago"
              }
              {...mpForm.register("webhookSecret")}
            />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </TabsContent>

      <TabsContent value="whatsapp">
        <div className="max-w-lg space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status da sessão</span>
            <Badge variant={whatsapp.status === "connected" ? "default" : "secondary"}>
              {whatsapp.status}
            </Badge>
          </div>
          {whatsapp.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Atualizado: {new Date(whatsapp.updatedAt).toLocaleString("pt-BR")}
            </p>
          )}
          <Button asChild>
            <Link href="/admin/whatsapp">Conectar WhatsApp</Link>
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="smtp">
        <form
          className="max-w-lg space-y-4"
          onSubmit={smtpForm.handleSubmit(async (data) => {
            const res = await saveSmtpSettings(data);
            if (res.success) toast.success("SMTP salvo");
            else toast.error(res.error);
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input {...smtpForm.register("host")} />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input type="number" {...smtpForm.register("port", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input {...smtpForm.register("user")} />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" {...smtpForm.register("password")} />
          </div>
          <div className="space-y-2">
            <Label>Remetente (from)</Label>
            <Input {...smtpForm.register("from")} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const email = prompt("E-mail para teste:");
                if (!email) return;
                const res = await sendSmtpTest(email);
                if (res.success) toast.success("E-mail de teste enviado");
                else toast.error(res.error);
              }}
            >
              Enviar teste
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
