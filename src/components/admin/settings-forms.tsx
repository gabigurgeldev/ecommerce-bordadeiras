"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  KeyRound,
  Loader2,
  QrCode,
  Settings,
  ShieldCheck,
  TestTube2,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import type { StorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import {
  mercadoPagoSettingsSchema,
  melhorEnvioSettingsFormSchema,
  openRouterSettingsSchema,
  shippingSettingsFormSchema,
  smtpSettingsSchema,
  storefrontUtilitySettingsSchema,
} from "@/lib/validations/admin";
import {
  disconnectMelhorEnvioSettings,
  fetchMercadoPagoInstallmentRatesForAdmin,
  saveMelhorEnvioSettings,
  saveMercadoPagoSettings,
  saveOpenRouterSettings,
  saveShippingSettings,
  saveSmtpSettings,
  saveStorefrontUtilitySettings,
  sendSmtpTest,
} from "@/actions/admin/settings";
import type { InstallmentResult } from "@/lib/mercadopago-installments";
import { AiImproveButton } from "@/components/admin/ai-improve-button";
import { OpenRouterModelPicker } from "@/components/admin/openrouter-model-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { z } from "zod";

const CHECKOUT_THEME_DEFAULTS = {
  primaryColor: "#e11d48",
  primaryFg: "#ffffff",
  pageBg: "",
  cardBg: "#ffffff",
  cardBorder: "#e4e4e7",
  headingColor: "",
  bodyColor: "",
  mutedColor: "#71717a",
  borderRadius: "2xl" as const,
  ctaLabel: "",
};

type MpValues = z.infer<typeof mercadoPagoSettingsSchema>;
type MpFormValues = MpValues & {
  hasAccessToken?: boolean;
  hasPublicKey?: boolean;
  hasWebhookSecret?: boolean;
  credentialsValid?: boolean;
  credentialsError?: string | null;
};
type SmtpValues = z.infer<typeof smtpSettingsSchema>;
type UtilityValues = z.infer<typeof storefrontUtilitySettingsSchema>;
type OpenRouterValues = z.infer<typeof openRouterSettingsSchema>;
type OpenRouterFormValues = OpenRouterValues & { hasApiKey?: boolean };
type ShippingValues = z.infer<typeof shippingSettingsFormSchema>;
type MelhorEnvioValues = z.infer<typeof melhorEnvioSettingsFormSchema>;
type MelhorEnvioAdminState = MelhorEnvioValues & {
  hasSandboxClientSecret?: boolean;
  hasProductionClientSecret?: boolean;
  sandboxConnected?: boolean;
  productionConnected?: boolean;
  activeConnected?: boolean;
  redirectUri?: string;
};

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

async function lookupCep(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

function InstallmentRatesDialog({
  open,
  onClose,
  results,
  installmentFees,
}: {
  open: boolean;
  onClose: () => void;
  results: InstallmentResult[];
  installmentFees: "merchant" | "buyer";
}) {
  const [activeMethod, setActiveMethod] = useState<string>(
    results[0]?.paymentMethodId ?? "visa",
  );
  const activeResult =
    results.find((r) => r.paymentMethodId === activeMethod) ?? results[0];

  const fmtBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            Taxas de parcelamento — Mercado Pago
          </DialogTitle>
          <DialogDescription>
            Valor de referência:{" "}
            <strong>{fmtBRL(activeResult?.referenceAmount ?? 0)}</strong>.
            Dados consultados em tempo real na API do Mercado Pago.
          </DialogDescription>
        </DialogHeader>

        {/* Payment method tabs */}
        {results.length > 1 && (
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {results.map((r) => (
              <button
                key={r.paymentMethodId}
                type="button"
                onClick={() => setActiveMethod(r.paymentMethodId)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeMethod === r.paymentMethodId
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.paymentMethodLabel}
              </button>
            ))}
          </div>
        )}

        {/* Installments table */}
        {activeResult && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Parcelas</th>
                  <th className="px-3 py-2">Taxa&nbsp;%</th>
                  <th className="px-3 py-2">Valor&nbsp;/&nbsp;parcela</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {activeResult.rows.map((row) => (
                  <tr
                    key={row.installments}
                    className={cn(
                      "border-t transition-colors",
                      row.installmentRate === 0 && "bg-emerald-500/5",
                    )}
                  >
                    <td className="px-3 py-2 font-medium">{row.installments}x</td>
                    <td className="px-3 py-2">
                      {row.installmentRate === 0 ? (
                        <Badge variant="default" className="gap-1 text-xs">
                          Sem juros
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {row.installmentRate.toFixed(2)}%
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmtBRL(row.installmentAmount)}</td>
                    <td className="px-3 py-2 font-medium tabular-nums">
                      {fmtBRL(row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Context info */}
        <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Info className="h-4 w-4 text-blue-500" />
            Contexto sobre os juros
          </p>
          <p className="text-muted-foreground">
            {installmentFees === "merchant" ? (
              <>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Loja absorve os juros
                </span>{" "}
                — o comprador vê sempre parcelas sem juros. O custo da taxa é descontado do
                valor que a loja recebe.
              </>
            ) : (
              <>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Comprador paga os juros
                </span>{" "}
                — o valor exibido por parcela já inclui a taxa do Mercado Pago. A loja recebe
                o valor original do pedido.
              </>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            Fonte oficial:
            <a
              href="https://www.mercadopago.com.br/developers/pt/reference/payment_methods/resource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
            >
              API Mercado Pago — Meios de pagamento
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">{children}</div>
  );
}

export function SettingsTabs({
  mercadoPago,
  smtp,
  whatsapp,
  storefrontUtility,
  openRouter,
  shipping,
  melhorEnvio,
  webhookUrl,
}: {
  mercadoPago: MpFormValues;
  smtp: SmtpValues & { port: number | string };
  whatsapp: { status: string; updatedAt: Date | null };
  storefrontUtility: StorefrontUtilitySettings;
  openRouter: OpenRouterFormValues;
  shipping: ShippingValues;
  melhorEnvio: MelhorEnvioAdminState;
  webhookUrl: string;
}) {
  const [installmentResults, setInstallmentResults] = useState<InstallmentResult[]>([]);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const router = useRouter();
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedMelhorEnvioRedirect, setCopiedMelhorEnvioRedirect] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [connectingMelhorEnvio, setConnectingMelhorEnvio] = useState(false);
  const [melhorEnvioSecrets, setMelhorEnvioSecrets] = useState({
    sandbox: melhorEnvio.hasSandboxClientSecret ?? false,
    production: melhorEnvio.hasProductionClientSecret ?? false,
  });
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

  const openRouterForm = useForm<OpenRouterFormValues>({
    resolver: zodResolver(openRouterSettingsSchema),
    defaultValues: openRouter,
  });

  const shippingForm = useForm<ShippingValues>({
    resolver: zodResolver(shippingSettingsFormSchema),
    defaultValues: shipping,
  });

  const melhorEnvioForm = useForm<MelhorEnvioValues>({
    resolver: zodResolver(melhorEnvioSettingsFormSchema),
    defaultValues: {
      useSandbox: melhorEnvio.useSandbox,
      sandboxClientId: melhorEnvio.sandboxClientId,
      sandboxClientSecret: "",
      productionClientId: melhorEnvio.productionClientId,
      productionClientSecret: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("melhorEnvio");
    const message = params.get("message");
    if (status === "connected") {
      toast.success("Melhor Envio conectado com sucesso");
      window.history.replaceState({}, "", "/admin/configuracoes#shipping");
    } else if (status === "error") {
      if (message === "missing_client_id") {
        toast.error(
          "Salve o Client ID do ambiente ativo (Sandbox ou Produção) antes de conectar.",
        );
      } else if (message === "missing_client_secret") {
        toast.error(
          "Salve o Client Secret do ambiente ativo antes de conectar.",
        );
      } else if (message === "token_exchange_failed") {
        const detail = params.get("detail");
        const description = params.get("description");
        if (
          detail === "invalid_client" ||
          description?.toLowerCase().includes("client authentication failed")
        ) {
          toast.error(
            "Client Secret incorreto ou credenciais do ambiente errado. No painel ME (sandbox ≠ produção), copie o Secret novamente, salve e clique em Conectar.",
          );
        } else if (detail === "missing_credentials" || detail === "invalid_request") {
          toast.error(
            description ??
              "Credenciais incompletas. Preencha Client ID e Secret do ambiente ativo (sandbox ou produção) e salve antes de conectar.",
          );
        } else if (detail === "html_response") {
          toast.error(
            description ??
              "Resposta inválida do Melhor Envio. Verifique credenciais, Redirect URI e se o servidor permite acesso de saída a melhorenvio.com.br.",
          );
        } else if (description && !description.trimStart().startsWith("<")) {
          toast.error(`Melhor Envio: ${description}`);
        } else {
          toast.error(
            "Falha ao trocar o código de autorização. Confira Client Secret, Redirect URI completa no painel ME e se o ambiente (sandbox/produção) está correto.",
          );
        }
      } else if (message === "invalid_client") {
        toast.error(
          "Melhor Envio rejeitou o app: verifique Client ID do ambiente ativo e cadastre a Redirect URI completa (incluindo /api/integrations/melhor-envio/callback) no painel ME.",
        );
      } else if (message) {
        toast.error(`Melhor Envio: ${message}`);
      } else {
        toast.error("Não foi possível conectar o Melhor Envio. Tente novamente.");
      }
      window.history.replaceState({}, "", "/admin/configuracoes#shipping");
    }
  }, []);

  const whatsappStatusLabel =
    whatsapp.status === "connected" ? "Conectado" : whatsapp.status;

  return (
    <Tabs defaultValue="mercadopago" className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border bg-muted/30 p-1 lg:sticky lg:top-4 lg:w-52 lg:shrink-0 lg:flex-col lg:items-stretch lg:self-start">
        <TabsTrigger value="mercadopago" className="justify-start data-[state=active]:bg-background">
          Pagamentos
        </TabsTrigger>
        <TabsTrigger value="smtp" className="justify-start data-[state=active]:bg-background">
          E-mail (SMTP)
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="justify-start data-[state=active]:bg-background">
          WhatsApp
        </TabsTrigger>
        <TabsTrigger value="storefront" className="justify-start data-[state=active]:bg-background">
          Aparência
        </TabsTrigger>
        <TabsTrigger value="ai" className="justify-start data-[state=active]:bg-background">
          Inteligência Artificial
        </TabsTrigger>
        <TabsTrigger value="shipping" className="justify-start data-[state=active]:bg-background">
          Frete e Envio
        </TabsTrigger>
      </TabsList>

      <div className="min-w-0 flex-1 space-y-6">
        <TabsContent value="mercadopago" className="mt-0">
          <form
            className="space-y-5"
            onSubmit={mpForm.handleSubmit(async (data) => {
              const res = await saveMercadoPagoSettings(data);
              if (res.success) toast.success("Configurações de pagamento salvas");
              else toast.error(res.error);
            })}
          >
            {/* Status header */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent shadow-none">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Mercado Pago</h3>
                    <p className="text-sm text-muted-foreground">Gateway de pagamento integrado</p>
                  </div>
                </div>
                <Badge
                  variant={mercadoPago.credentialsValid ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      mercadoPago.credentialsValid ? "bg-green-400" : "bg-muted-foreground"
                    }`}
                  />
                  {mercadoPago.credentialsValid
                    ? mpForm.watch("sandbox")
                      ? "Sandbox ativo"
                      : "Produção ativa"
                    : "Credenciais incompletas"}
                </Badge>
              </CardContent>
            </Card>

            {/* Credenciais */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Credenciais do Mercado Pago
                </CardTitle>
                <CardDescription>
                  Cole a Public Key e o Access Token do painel Mercado Pago.
                  {mpForm.watch("sandbox")
                    ? " Para sandbox, use as credenciais da aba Teste."
                    : " Para produção, use as credenciais da aba Produtivas."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mercadoPago.credentialsError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                    <p className="mt-1 text-xs">{mercadoPago.credentialsError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input
                    {...mpForm.register("publicKey")}
                    placeholder="APP_USR-..."
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder={
                      mercadoPago.hasAccessToken
                        ? "•••••••• (deixe em branco para manter)"
                        : "APP_USR-..."
                    }
                    {...mpForm.register("accessToken")}
                    className="font-mono text-sm"
                  />
                  {mercadoPago.hasAccessToken && (
                    <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Access Token salvo — ao trocar a Public Key, cole o token novamente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Webhook */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <Input
                    type="password"
                    placeholder={
                      mercadoPago.hasWebhookSecret
                        ? "•••••••• (deixe em branco para manter)"
                        : "Secret de validação de webhooks"
                    }
                    {...mpForm.register("webhookSecret")}
                    className="font-mono text-sm"
                  />
                  {mercadoPago.hasWebhookSecret && (
                    <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Webhook Secret salvo com segurança
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      title="Copiar URL"
                    >
                      {copiedWebhook ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure este URL em: Mercado Pago → Seu negócio → Configurações →
                    Notificações
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ambiente */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                    <TestTube2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Ambiente
                </CardTitle>
                <CardDescription>
                  Use sandbox para testes sem cobranças reais. Desligue para produção.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                    mpForm.watch("sandbox")
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TestTube2
                      className={`h-5 w-5 ${mpForm.watch("sandbox") ? "text-amber-600" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">Modo Sandbox</p>
                      <p className="text-xs text-muted-foreground">
                        Pagamentos de teste sem cobranças reais
                      </p>
                    </div>
                  </div>
                  <div className="relative h-6 w-11 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      {...mpForm.register("sandbox")}
                    />
                    <div className="h-6 w-11 rounded-full bg-input transition-colors peer-checked:bg-amber-500" />
                    <div
                      className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        mpForm.watch("sandbox") ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </label>
                {mpForm.watch("sandbox") && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Modo sandbox ativo. Copie Public Key e Access Token em Suas integrações →
                      Testes → Credenciais de teste (também começam com APP_USR-). Nenhuma
                      cobrança real será realizada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Métodos de Pagamento
                </CardTitle>
                <CardDescription>
                  Selecione os métodos disponíveis no checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      {
                        key: "pix",
                        label: "PIX",
                        icon: QrCode,
                        color: "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-100 dark:bg-emerald-950/50",
                        active:
                          "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
                      },
                      {
                        key: "credit_card",
                        label: "Crédito",
                        icon: CreditCard,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-100 dark:bg-blue-950/50",
                        active: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
                      },
                      {
                        key: "debit_card",
                        label: "Débito",
                        icon: Wallet,
                        color: "text-violet-600 dark:text-violet-400",
                        bg: "bg-violet-100 dark:bg-violet-950/50",
                        active:
                          "border-violet-400 bg-violet-50 dark:bg-violet-950/20",
                      },
                      {
                        key: "boleto",
                        label: "Boleto",
                        icon: FileText,
                        color: "text-orange-600 dark:text-orange-400",
                        bg: "bg-orange-100 dark:bg-orange-950/50",
                        active:
                          "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
                      },
                    ] as const
                  ).map(({ key, label, icon: Icon, color, bg, active }) => {
                    const enabled = mpForm.watch(`enabledMethods.${key}`);
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                          enabled ? active : "border-border hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          {...mpForm.register(`enabledMethods.${key}`)}
                        />
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}
                        >
                          <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                        <Badge
                          variant={enabled ? "default" : "outline"}
                          className="text-xs"
                        >
                          {enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Parcelamento */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <BarChart3 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Parcelamento
                </CardTitle>
                <CardDescription>
                  Configure o máximo de parcelas e quem paga os juros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Máximo de parcelas</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      {...mpForm.register("maxInstallments")}
                    />
                    <p className="text-xs text-muted-foreground">De 1 (à vista) a 12x</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Juros das parcelas</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      {...mpForm.register("installmentFees")}
                    >
                      <option value="buyer">Comprador paga os juros</option>
                      <option value="merchant">Loja absorve (sem juros)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Quando a loja absorve, os juros saem do valor recebido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Taxas por parcela */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/50">
                    <BarChart3 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  Taxas por Parcela
                </CardTitle>
                <CardDescription>
                  Consulte em tempo real as taxas do Mercado Pago para um valor de referência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loadingRates}
                    className="gap-2"
                    onClick={async () => {
                      setLoadingRates(true);
                      const res = await fetchMercadoPagoInstallmentRatesForAdmin(100_000);
                      setLoadingRates(false);
                      if (res.success) {
                        setInstallmentResults(res.results);
                        setRatesDialogOpen(true);
                        if (res.errors.length > 0) {
                          toast.warning(
                            `${res.errors.length} bandeira(s) sem dados: ${res.errors
                              .map((e) => e.paymentMethodId)
                              .join(", ")}`,
                          );
                        }
                      } else {
                        toast.error(res.error);
                      }
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    {loadingRates ? "Consultando…" : "Consultar taxas"}
                  </Button>
                  {installmentResults.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => setRatesDialogOpen(true)}
                    >
                      <Info className="h-3.5 w-3.5" />
                      Ver taxas consultadas
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Consulta Visa, Mastercard e Elo para um valor de referência de{" "}
                  <strong>R$&nbsp;1.000,00</strong> diretamente na API do Mercado Pago.
                </p>
                {installmentResults.length > 0 && (
                  <InstallmentRatesDialog
                    open={ratesDialogOpen}
                    onClose={() => setRatesDialogOpen(false)}
                    results={installmentResults}
                    installmentFees={mpForm.watch("installmentFees") ?? "buyer"}
                  />
                )}
              </CardContent>
            </Card>

            {/* Personalização do checkout */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950/50">
                        <Settings className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                      </div>
                      Personalização do Checkout
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Texto e elementos visuais exibidos na página de pagamento
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href="/admin/configuracoes/checkout-personalizacao">
                      Abrir editor completo →
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título da página</Label>
                  <Input
                    {...mpForm.register("checkoutTitle")}
                    placeholder="Finalizar compra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    {...mpForm.register("checkoutSubtitle")}
                    placeholder="Pagamento 100% seguro"
                  />
                </div>
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                    mpForm.watch("showTrustBadges")
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      className={`h-5 w-5 ${mpForm.watch("showTrustBadges") ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">Selos de segurança</p>
                      <p className="text-xs text-muted-foreground">
                        Exibe selos de formas de pagamento no checkout
                      </p>
                    </div>
                  </div>
                  <div className="relative h-6 w-11 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      {...mpForm.register("showTrustBadges")}
                    />
                    <div className="h-6 w-11 rounded-full bg-input transition-colors peer-checked:bg-primary" />
                    <div
                      className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        mpForm.watch("showTrustBadges") ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </label>

              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <Button type="submit">Salvar configurações</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-0">
          <SettingsPanel
            title="WhatsApp"
            description="Status da sessão emissor. QR e destinatários ficam na página dedicada."
          >
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                <span className="text-sm font-medium">Status da sessão</span>
                <Badge variant={whatsapp.status === "connected" ? "default" : "secondary"}>
                  {whatsappStatusLabel}
                </Badge>
              </div>
              {whatsapp.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Atualizado: {new Date(whatsapp.updatedAt).toLocaleString("pt-BR")}
                </p>
              )}
              <Button asChild>
                <Link href="/admin/whatsapp">Gerenciar conexão WhatsApp</Link>
              </Button>
            </div>
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="smtp" className="mt-0 space-y-6">
          <Card className="border-dashed bg-muted/20 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Desenvolvimento local (Mailpit)</CardTitle>
              <CardDescription>
                Teste e-mails sem enviar mensagens reais usando{" "}
                <a
                  href="https://github.com/axllent/mailpit"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mailpit
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="grid gap-1 sm:grid-cols-2">
                <li>
                  Host: <code className="text-xs">localhost</code>
                </li>
                <li>
                  Porta SMTP: <code className="text-xs">1025</code> (sem TLS)
                </li>
                <li>Usuário/senha: deixe em branco</li>
                <li>
                  Remetente: <code className="text-xs">dev@localhost</code>
                </li>
                <li className="sm:col-span-2">
                  Inbox web: <code className="text-xs">http://localhost:8025</code>
                </li>
              </ul>
            </CardContent>
          </Card>

          <SettingsPanel title="E-mail (SMTP)" description="Servidor de envio de e-mails transacionais.">
            <form
              className="max-w-2xl space-y-4"
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
              <FormActions>
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
              </FormActions>
            </form>
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="storefront" className="mt-0 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Outros elementos da vitrine</CardTitle>
              <CardDescription>Banners, barra de confiança e histórico de alterações.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/banners">Banners do carrossel</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/confianca">Barra de confiança</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/auditoria">Auditoria</Link>
              </Button>
            </CardContent>
          </Card>

          <SettingsPanel
            title="Barra superior da loja"
            description="Faixa fina no topo (mensagem, cores). Links à direita vêm do site."
          >
            <form
              className="max-w-2xl space-y-4"
              onSubmit={utilityForm.handleSubmit(async (data) => {
                const res = await saveStorefrontUtilitySettings(data);
                if (res.success) toast.success("Barra superior salva");
                else toast.error(res.error);
              })}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Mensagem</Label>
                  <AiImproveButton
                    context="storefront-utility"
                    scope="message"
                    input={{ message: utilityForm.watch("message") ?? "" }}
                    disabled={!utilityForm.watch("message")?.trim()}
                    onImprove={(fields) => {
                      if (fields.message) {
                        utilityForm.setValue("message", fields.message, { shouldValidate: true });
                      }
                    }}
                  />
                </div>
                <Input {...utilityForm.register("message")} />
                <p className="text-xs text-muted-foreground">
                  Texto simples ou HTML leve (ex.: link com &lt;a&gt;).
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cor de fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...utilityForm.register("backgroundColor")}
                      className="h-10 w-14 shrink-0 p-1"
                    />
                    <Input {...utilityForm.register("backgroundColor")} placeholder="#7a5a42" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do texto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...utilityForm.register("textColor")}
                      className="h-10 w-14 shrink-0 p-1"
                    />
                    <Input {...utilityForm.register("textColor")} placeholder="#faf6ef" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link da mensagem (opcional)</Label>
                <Input {...utilityForm.register("link")} placeholder="https://wa.me/..." />
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
              <FormActions>
                <Button type="submit">Salvar</Button>
              </FormActions>
            </form>
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <SettingsPanel
            title="Inteligência Artificial"
            description="OpenRouter para melhorar textos no admin com o botão “Melhorar com IA”."
          >
            <form
              className="max-w-2xl space-y-4"
              onSubmit={openRouterForm.handleSubmit(async (data) => {
                const res = await saveOpenRouterSettings(data);
                if (res.success) toast.success("Configurações de IA salvas");
                else toast.error(res.error);
              })}
            >
              <div className="space-y-2">
                <Label>API Key (OpenRouter)</Label>
                <Input
                  type="password"
                  placeholder={
                    openRouter.hasApiKey
                      ? "•••••••• (deixe em branco para manter)"
                      : "sk-or-v1-..."
                  }
                  {...openRouterForm.register("apiKey")}
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    openrouter.ai/keys
                  </a>
                  . A chave fica armazenada apenas no servidor.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Modelo padrão</Label>
                <OpenRouterModelPicker
                  value={openRouterForm.watch("defaultModel") ?? ""}
                  onChange={(modelId) =>
                    openRouterForm.setValue("defaultModel", modelId, { shouldValidate: true })
                  }
                />
              </div>
              <FormActions>
                <Button type="submit">Salvar</Button>
              </FormActions>
            </form>
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="shipping" className="mt-0">
          <SettingsPanel
            title="Frete e Envio"
            description="Endereço de origem para cálculo de frete e regras globais da loja."
          >
            <form
              className="max-w-2xl space-y-5"
              onSubmit={shippingForm.handleSubmit(async (data) => {
                const res = await saveShippingSettings(data);
                if (res.success) toast.success("Configurações de frete salvas");
                else toast.error(res.error);
              })}
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/50">
                      <Truck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    Endereço de origem (empresa)
                  </CardTitle>
                  <CardDescription>
                    CEP de onde os pedidos são despachados. Usado no cálculo via Melhor Envio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ship-cep">CEP</Label>
                    <div className="relative max-w-xs">
                      <Input
                        id="ship-cep"
                        placeholder="00000-000"
                        value={shippingForm.watch("originCep")}
                        onChange={async (e) => {
                          const masked = maskCep(e.target.value);
                          shippingForm.setValue("originCep", masked, { shouldValidate: true });
                          const digits = masked.replace(/\D/g, "");
                          if (digits.length === 8) {
                            setLoadingCep(true);
                            try {
                              const data = await lookupCep(digits);
                              if (data) {
                                shippingForm.setValue("originStreet", data.logradouro ?? "", {
                                  shouldValidate: true,
                                });
                                shippingForm.setValue("originNeighborhood", data.bairro ?? "", {
                                  shouldValidate: true,
                                });
                                shippingForm.setValue("originCity", data.localidade ?? "", {
                                  shouldValidate: true,
                                });
                                shippingForm.setValue("originState", data.uf ?? "", {
                                  shouldValidate: true,
                                });
                              } else {
                                toast.error("CEP não encontrado");
                              }
                            } finally {
                              setLoadingCep(false);
                            }
                          }
                        }}
                      />
                      {loadingCep ? (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="ship-street">Rua</Label>
                      <Input id="ship-street" {...shippingForm.register("originStreet")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-number">Número</Label>
                      <Input id="ship-number" {...shippingForm.register("originNumber")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ship-complement">Complemento</Label>
                    <Input
                      id="ship-complement"
                      placeholder="Opcional"
                      {...shippingForm.register("originComplement")}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ship-neighborhood">Bairro</Label>
                      <Input id="ship-neighborhood" {...shippingForm.register("originNeighborhood")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-city">Cidade</Label>
                      <Input id="ship-city" {...shippingForm.register("originCity")} />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-[8rem]">
                    <Label htmlFor="ship-state">UF</Label>
                    <Input
                      id="ship-state"
                      maxLength={2}
                      placeholder="SP"
                      {...shippingForm.register("originState")}
                      onChange={(e) =>
                        shippingForm.setValue("originState", e.target.value.toUpperCase(), {
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Frete grátis global</CardTitle>
                  <CardDescription>
                    Valor mínimo do pedido (subtotal) para frete grátis em toda a loja. Deixe em
                    branco para desativar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="ship-threshold">Limite de frete grátis</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="ship-threshold"
                        placeholder="0,00"
                        className="pl-9"
                        {...shippingForm.register("freeThresholdReais")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ex.: 199,90 — pedidos acima desse valor têm frete grátis (exceto produtos com
                      frete fixo).
                    </p>
                  </div>
                </CardContent>
              </Card>

              <FormActions>
                <Button type="submit">Salvar configurações</Button>
              </FormActions>
            </form>

            <Card className="mt-6 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Melhor Envio</CardTitle>
                <CardDescription>
                  Cotação de frete via API do Melhor Envio (Correios, Jadlog e outras
                  transportadoras).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all hover:border-primary/40">
                  <div>
                    <p className="text-sm font-medium">Modo sandbox</p>
                    <p className="text-xs text-muted-foreground">
                      Use sandbox para testes sem cobranças reais
                    </p>
                  </div>
                  <Switch
                    checked={melhorEnvioForm.watch("useSandbox")}
                    onCheckedChange={(checked) =>
                      melhorEnvioForm.setValue("useSandbox", checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-xl border p-4">
                    <p className="text-sm font-medium">Sandbox</p>
                    <div className="space-y-2">
                      <Label htmlFor="me-sandbox-id">Client ID</Label>
                      <Input
                        id="me-sandbox-id"
                        {...melhorEnvioForm.register("sandboxClientId")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="me-sandbox-secret">Client Secret</Label>
                      <Input
                        id="me-sandbox-secret"
                        type="password"
                        placeholder={
                          melhorEnvioSecrets.sandbox
                            ? "•••••••• (deixe em branco para manter)"
                            : "Cole o Client Secret"
                        }
                        {...melhorEnvioForm.register("sandboxClientSecret")}
                      />
                    </div>
                    <Badge variant={melhorEnvio.sandboxConnected ? "default" : "secondary"}>
                      {melhorEnvio.sandboxConnected ? "Conectado" : "Não conectado"}
                    </Badge>
                  </div>

                  <div className="space-y-3 rounded-xl border p-4">
                    <p className="text-sm font-medium">Produção</p>
                    <div className="space-y-2">
                      <Label htmlFor="me-prod-id">Client ID</Label>
                      <Input
                        id="me-prod-id"
                        {...melhorEnvioForm.register("productionClientId")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="me-prod-secret">Client Secret</Label>
                      <Input
                        id="me-prod-secret"
                        type="password"
                        placeholder={
                          melhorEnvioSecrets.production
                            ? "•••••••• (deixe em branco para manter)"
                            : "Cole o Client Secret"
                        }
                        {...melhorEnvioForm.register("productionClientSecret")}
                      />
                    </div>
                    <Badge variant={melhorEnvio.productionConnected ? "default" : "secondary"}>
                      {melhorEnvio.productionConnected ? "Conectado" : "Não conectado"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Redirect URI (cadastrar no app Melhor Envio)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={melhorEnvio.redirectUri ?? ""}
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!melhorEnvio.redirectUri) return;
                        navigator.clipboard.writeText(melhorEnvio.redirectUri);
                        setCopiedMelhorEnvioRedirect(true);
                        setTimeout(() => setCopiedMelhorEnvioRedirect(false), 2000);
                      }}
                      title="Copiar Redirect URI"
                    >
                      {copiedMelhorEnvioRedirect ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No painel Melhor Envio (Área Dev → seu app), cadastre{" "}
                    <strong>exatamente</strong> esta URL no campo de callback — incluindo o caminho{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      /api/integrations/melhor-envio/callback
                    </code>
                    . Cadastrar só o domínio (ex.:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      https://seusite.com.br
                    </code>
                    ) causa erro <strong>invalid_client</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={melhorEnvioForm.handleSubmit(async (data) => {
                      const res = await saveMelhorEnvioSettings(data);
                      if (res.success) {
                        toast.success("Credenciais Melhor Envio salvas");
                        if (data.sandboxClientSecret?.trim()) {
                          setMelhorEnvioSecrets((prev) => ({ ...prev, sandbox: true }));
                        }
                        if (data.productionClientSecret?.trim()) {
                          setMelhorEnvioSecrets((prev) => ({ ...prev, production: true }));
                        }
                        melhorEnvioForm.setValue("sandboxClientSecret", "");
                        melhorEnvioForm.setValue("productionClientSecret", "");
                        router.refresh();
                      } else {
                        toast.error(res.error);
                      }
                    })}
                  >
                    Salvar credenciais
                  </Button>
                  <Button
                    type="button"
                    disabled={connectingMelhorEnvio}
                    onClick={async () => {
                      const data = melhorEnvioForm.getValues();
                      const useSandbox = data.useSandbox;
                      const clientId = useSandbox
                        ? data.sandboxClientId?.trim()
                        : data.productionClientId?.trim();
                      const clientSecret = useSandbox
                        ? data.sandboxClientSecret?.trim()
                        : data.productionClientSecret?.trim();

                      if (!clientId) {
                        toast.error(
                          `Informe o Client ID de ${useSandbox ? "Sandbox" : "Produção"} antes de conectar.`,
                        );
                        return;
                      }

                      if (!clientSecret) {
                        toast.error(
                          `Cole o Client Secret de ${useSandbox ? "Sandbox" : "Produção"} antes de conectar (copie do painel Área Dev do Melhor Envio).`,
                        );
                        return;
                      }

                      setConnectingMelhorEnvio(true);
                      try {
                        const res = await saveMelhorEnvioSettings(data);
                        if (!res.success) {
                          toast.error(res.error);
                          return;
                        }
                        if (data.sandboxClientSecret?.trim()) {
                          setMelhorEnvioSecrets((prev) => ({ ...prev, sandbox: true }));
                        }
                        if (data.productionClientSecret?.trim()) {
                          setMelhorEnvioSecrets((prev) => ({ ...prev, production: true }));
                        }
                        window.location.href =
                          "/api/integrations/melhor-envio/authorize";
                      } finally {
                        setConnectingMelhorEnvio(false);
                      }
                    }}
                  >
                    {connectingMelhorEnvio ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Conectando…
                      </>
                    ) : (
                      "Conectar Melhor Envio"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const res = await disconnectMelhorEnvioSettings();
                      if (res.success) {
                        toast.success("Melhor Envio desconectado");
                        router.refresh();
                      } else {
                        toast.error(res.error);
                      }
                    }}
                  >
                    Desconectar
                  </Button>
                </div>

                <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Ambiente ativo:{" "}
                    <strong>
                      {melhorEnvioForm.watch("useSandbox") ? "Sandbox" : "Produção"}
                    </strong>
                    . Preencha Client ID e Secret do ambiente ativo, depois clique em{" "}
                    <strong>Conectar Melhor Envio</strong> (as credenciais são salvas
                    automaticamente).
                  </span>
                </p>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    O Melhor Envio exige URL de callback em <strong>HTTPS</strong> — não aceita{" "}
                    <code className="rounded bg-muted px-1 py-0.5">http://localhost</code>. Para
                    desenvolver localmente, cadastre a URL HTTPS de produção acima no app ME e
                    defina{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      MELHOR_ENVIO_REDIRECT_URI
                    </code>{" "}
                    no <code className="rounded bg-muted px-1 py-0.5">.env</code> com o mesmo
                    valor.
                  </span>
                </div>
              </CardContent>
            </Card>
          </SettingsPanel>
        </TabsContent>
      </div>
    </Tabs>
  );
}
