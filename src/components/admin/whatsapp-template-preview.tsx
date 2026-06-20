"use client";

import { useMemo } from "react";
import { Smartphone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { escapeHtml } from "@/lib/sanitize";
import type { WhatsappTemplateRecipientType } from "@/lib/types/database";

interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

interface WhatsappTemplatePreviewProps {
  template: string;
  variables?: TemplateVariable[];
  recipientType?: WhatsappTemplateRecipientType;
}

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  "{{orderId}}": "12345678",
  "{{customerName}}": "Maria Silva",
  "{{amount}}": "R$ 150,00",
  "{{amountCents}}": "15000",
  "{{trackingCode}}": "AA123456789BR",
  "{{storeName}}": "Bordadeiras Store",
  "{{orderDate}}": "10/06/2026",
  "{{checkoutUrl}}": "https://loja.com/checkout?order=abc123",
  "{{cartSummary}}": "• Linha de bordado × 2\n• Bastidor 20cm × 1",
  "{{cartTotal}}": "R$ 89,90",
  "{{message}}": "Temos novidades que combinam com o seu perfil!",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTemplate(template: string, variables: Record<string, string>): string {
  let result = escapeHtml(template);
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(escapeRegExp(escapeHtml(key)), "g"), escapeHtml(value));
  }
  // Highlight any remaining unfilled variables
  result = result.replace(/\{\{(\w+)\}\}/g, '<span class="text-amber-500">{{$1}}</span>');
  return result.replace(/\n/g, "<br/>");
}

export function WhatsappTemplatePreview({
  template,
  variables = [],
  recipientType = "CUSTOMER",
}: WhatsappTemplatePreviewProps) {
  const formattedMessage = useMemo(() => {
    return formatTemplate(template || "", SAMPLE_DATA);
  }, [template]);

  const recipientLabel = recipientType === "CUSTOMER" ? "Cliente" : "Vendedor";
  const recipientColor = recipientType === "CUSTOMER" ? "bg-green-500" : "bg-blue-500";

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Preview no WhatsApp
        </CardTitle>
        <CardDescription className="text-xs">
          Veja como a mensagem aparecerá no WhatsApp do {recipientLabel.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-[300px] bg-gray-900 rounded-[2.5rem] p-3 shadow-xl">
          {/* Phone frame */}
          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* WhatsApp header */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${recipientColor} flex items-center justify-center`}>
                <span className="text-xs font-medium text-white">
                  {recipientLabel[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {recipientType === "CUSTOMER" ? "Maria Silva" : "Vendedores"}
                </p>
                <p className="text-[10px] text-white/70">online</p>
              </div>
              <MessageCircle className="h-4 w-4 text-white/70" />
            </div>

            {/* Chat area */}
            <div className="bg-[#E5DDD5] min-h-[300px] p-3 space-y-3">
              {/* Date separator */}
              <div className="flex justify-center">
                <span className="text-[10px] bg-[#D1D7DB] text-gray-600 px-2 py-1 rounded">
                  HOJE
                </span>
              </div>

              {/* Message bubble */}
              <div className="flex justify-end">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
                  <div
                    className="text-sm text-gray-800 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: formattedMessage }}
                  />
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">10:30</span>
                    <svg
                      className="w-3 h-3 text-[#53BDEB]"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-sm text-gray-400">
                Digite uma mensagem
              </div>
            </div>
          </div>
        </div>

        {/* Variables legend */}
        <div className="text-xs space-y-2">
          <p className="font-medium text-muted-foreground">Variáveis de exemplo usadas:</p>
          <div className="grid grid-cols-2 gap-2">
            {variables.length > 0 ? (
              variables.map((v) => (
                <div key={v.key} className="flex items-center gap-2 text-xs">
                  <code className="text-primary bg-primary/10 px-1 rounded text-[10px]">
                    {v.key}
                  </code>
                  <span className="text-muted-foreground truncate">{v.example}</span>
                </div>
              ))
            ) : (
              Object.entries(SAMPLE_DATA).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <code className="text-primary bg-primary/10 px-1 rounded text-[10px]">
                    {key}
                  </code>
                  <span className="text-muted-foreground truncate">{value}</span>
                </div>
              ))
            )}
          </div>
          <p className="text-[10px] text-amber-600">
            * Variáveis em <span className="text-amber-500 font-medium">laranja</span> não foram reconhecidas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}