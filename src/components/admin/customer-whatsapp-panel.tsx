"use client";

import {
  getOutreachPreview,
  sendCustomerOutreach,
} from "@/actions/admin/customer-outreach";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCustomerInsights } from "@/lib/data/admin-customer-insights";
import type { WhatsappTemplate } from "@/lib/types/database";
import { ExternalLink, MessageCircle, Send, Smartphone } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SendMode = "template" | "custom" | "link_only";

export function CustomerWhatsAppPanel({
  insights,
  templates,
  whatsappConnected,
}: {
  insights: AdminCustomerInsights;
  templates: WhatsappTemplate[];
  whatsappConnected: boolean;
}) {
  const [phone, setPhone] = useState(insights.resolvedPhone ?? "");
  const [mode, setMode] = useState<SendMode>("template");
  const [templateKey, setTemplateKey] = useState<string>(
    insights.opportunities.primaryOpportunity === "pending_payment"
      ? "outreach_pending_payment"
      : insights.opportunities.primaryOpportunity === "abandoned_cart"
        ? "outreach_abandoned_cart"
        : "outreach_generic",
  );
  const [customText, setCustomText] = useState("");
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);

  const loadPreview = useCallback(async () => {
    if (mode === "custom") {
      setPreview(customText);
      return;
    }
    if (mode === "link_only" && customText.trim()) {
      setPreview(customText);
      return;
    }
    if (!templateKey) {
      setPreview("");
      return;
    }
    const result = await getOutreachPreview(insights.profile.id, templateKey, {
      message: customText.trim(),
    });
    setPreview(result?.preview ?? "");
  }, [mode, templateKey, customText, insights.profile.id]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function handleSend(viaBaileys: boolean) {
    if (!phone.trim()) {
      toast.error("Informe o telefone do cliente");
      return;
    }

    setSending(true);
    try {
      const result = await sendCustomerOutreach({
        userId: insights.profile.id,
        mode: viaBaileys ? mode : "link_only",
        phone: phone.trim(),
        templateKey:
          mode === "template" || (!viaBaileys && mode !== "custom")
            ? templateKey
            : undefined,
        customText:
          mode === "custom"
            ? customText
            : templateKey === "outreach_generic"
              ? customText
              : undefined,
      });

      if (result.waLink && (!viaBaileys || !result.sent)) {
        window.open(result.waLink, "_blank", "noopener,noreferrer");
      }

      if (result.success && result.sent) {
        toast.success("Mensagem enviada pelo WhatsApp conectado!");
      } else if (result.success && result.waLink) {
        toast.info(result.notice ?? "Abrindo WhatsApp no navegador…");
      } else if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      setSending(false);
    }
  }

  function applyQuickAction(key: string) {
    setTemplateKey(key);
    setMode("template");
    setCustomText("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contato WhatsApp
          </CardTitle>
          <Badge variant={whatsappConnected ? "default" : "secondary"}>
            {whatsappConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
        {!whatsappConnected && (
          <p className="text-sm text-muted-foreground">
            Conecte o WhatsApp em{" "}
            <Link href="/admin/whatsapp" className="text-primary underline">
              Admin → WhatsApp
            </Link>{" "}
            para envio automático, ou use o link wa.me.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {insights.opportunities.pendingPaymentOrders.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickAction("outreach_pending_payment")}
            >
              Cobrar pagamento pendente
            </Button>
          )}
          {insights.opportunities.activeCart.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickAction("outreach_abandoned_cart")}
            >
              Recuperar sacola
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-phone">Telefone (com DDD)</Label>
          <Input
            id="wa-phone"
            placeholder="11999990000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["template", "Template automático"],
              ["custom", "Mensagem personalizada"],
              ["link_only", "Só abrir WhatsApp"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={mode === value ? "default" : "outline"}
              onClick={() => setMode(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {mode === "template" && (
          <div className="space-y-2">
            <Label>Template</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            {templateKey === "outreach_generic" && (
              <Textarea
                placeholder="Sua mensagem personalizada (variável {{message}})"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
              />
            )}
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={5}
              placeholder="Escreva a mensagem que será enviada ao cliente…"
            />
          </div>
        )}

        {preview && mode !== "link_only" && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" />
              Prévia da mensagem
            </p>
            <p className="whitespace-pre-wrap text-sm">{preview}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={sending || !whatsappConnected}
            onClick={() => void handleSend(true)}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar pelo número conectado
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={sending}
            onClick={() => void handleSend(false)}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
