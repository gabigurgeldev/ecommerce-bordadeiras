"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { StorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import {
  mercadoPagoSettingsSchema,
  smtpSettingsSchema,
  storefrontUtilitySettingsSchema,
} from "@/lib/validations/admin";
import {
  saveMercadoPagoSettings,
  saveSmtpSettings,
  saveStorefrontUtilitySettings,
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
type UtilityValues = z.infer<typeof storefrontUtilitySettingsSchema>;

export function SettingsTabs({
  mercadoPago,
  smtp,
  whatsapp,
  storefrontUtility,
}: {
  mercadoPago: MpFormValues;
  smtp: SmtpValues & { port: number | string };
  whatsapp: { status: string; updatedAt: Date | null };
  storefrontUtility: StorefrontUtilitySettings;
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

  const utilityForm = useForm<UtilityValues>({
    resolver: zodResolver(storefrontUtilitySettingsSchema),
    defaultValues: {
      message: storefrontUtility.message,
      backgroundColor: storefrontUtility.backgroundColor,
      textColor: storefrontUtility.textColor,
      link: storefrontUtility.link || "",
    },
  });

  return (
    <Tabs defaultValue="mercadopago">
      <TabsList>
        <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="smtp">SMTP</TabsTrigger>
        <TabsTrigger value="storefront">Barra superior</TabsTrigger>
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
        <div className="mb-4 max-w-lg rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Desenvolvimento local (Mailpit)</p>
          <p className="mt-2">
            Para testar e-mails sem enviar mensagens reais, use{" "}
            <a
              href="https://github.com/axllent/mailpit"
              className="font-medium text-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mailpit
            </a>
            :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Host: <code className="text-xs">localhost</code></li>
            <li>Porta SMTP: <code className="text-xs">1025</code> (sem TLS)</li>
            <li>Usuário/senha: deixe em branco</li>
            <li>Remetente: <code className="text-xs">dev@localhost</code></li>
            <li>Inbox web: <code className="text-xs">http://localhost:8025</code></li>
          </ul>
        </div>
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

      <TabsContent value="storefront">
        <form
          className="max-w-lg space-y-4"
          onSubmit={utilityForm.handleSubmit(async (data) => {
            const res = await saveStorefrontUtilitySettings(data);
            if (res.success) toast.success("Barra superior salva");
            else toast.error(res.error);
          })}
        >
          <p className="text-sm text-muted-foreground">
            Faixa fina no topo da loja (mensagem, cores). Links à direita (Sobre,
            Blog, telefone) vêm do site.
          </p>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Input {...utilityForm.register("message")} />
            <p className="text-xs text-muted-foreground">
              Texto simples ou HTML leve (ex.: link com &lt;a&gt;).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cor de fundo</Label>
              <div className="flex gap-2">
                <Input type="color" {...utilityForm.register("backgroundColor")} className="h-10 w-14 p-1" />
                <Input {...utilityForm.register("backgroundColor")} placeholder="#7a5a42" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor do texto</Label>
              <div className="flex gap-2">
                <Input type="color" {...utilityForm.register("textColor")} className="h-10 w-14 p-1" />
                <Input {...utilityForm.register("textColor")} placeholder="#faf6ef" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link da mensagem (opcional)</Label>
            <Input
              {...utilityForm.register("link")}
              placeholder="https://wa.me/..."
            />
          </div>
          <div
            className="rounded-lg border px-4 py-2 text-sm"
            style={{
              backgroundColor: utilityForm.watch("backgroundColor"),
              color: utilityForm.watch("textColor"),
            }}
          >
            {utilityForm.watch("message") || "Pré-visualização"}
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
