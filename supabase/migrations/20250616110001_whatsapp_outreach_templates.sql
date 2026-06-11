-- Templates de outreach (após commit dos novos valores do enum WhatsappTemplateEvent)

INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'outreach_pending_payment',
    'Cobrança - Pagamento Pendente',
    'Olá {{customerName}}! 👋

Vi que você tem um pedido *#{{orderId}}* no valor de *{{amount}}* aguardando pagamento.

Finalize aqui: {{checkoutUrl}}

Posso te ajudar com alguma dúvida? 💜',
    'CUSTOMER',
    'PENDING_PAYMENT',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'outreach_abandoned_cart',
    'Recuperação - Sacola Abandonada',
    'Olá {{customerName}}! 👋

Notei que você deixou itens na sacola:
{{cartSummary}}

Total: *{{cartTotal}}*

Quer finalizar sua compra? Estou à disposição para ajudar! 🛒',
    'CUSTOMER',
    'ABANDONED_CART',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'outreach_generic',
    'Contato Personalizado',
    'Olá {{customerName}}!

{{message}}

{{storeName}}',
    'CUSTOMER',
    'CUSTOM_OUTREACH',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
