-- Migration: WhatsApp Templates System
-- Cria tabela para templates de mensagens editáveis

-- Enum para tipo de destinatário
CREATE TYPE "WhatsappTemplateRecipientType" AS ENUM ('CUSTOMER', 'ADMIN');

-- Enum para eventos de pedido
CREATE TYPE "WhatsappTemplateEvent" AS ENUM (
    'NEW_ORDER',
    'PAYMENT_APPROVED',
    'ORDER_PROCESSING',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED'
);

-- Tabela de templates
CREATE TABLE "WhatsappTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipientType" "WhatsappTemplateRecipientType" NOT NULL,
    "event" "WhatsappTemplateEvent" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- Índices (o índice unique na key é criado automaticamente pela constraint UNIQUE)
CREATE INDEX "WhatsappTemplate_event_idx" ON "WhatsappTemplate"("event");
CREATE INDEX "WhatsappTemplate_recipientType_idx" ON "WhatsappTemplate"("recipientType");
CREATE INDEX "WhatsappTemplate_active_idx" ON "WhatsappTemplate"("active");

-- RLS
ALTER TABLE "WhatsappTemplate" ENABLE ROW LEVEL SECURITY;

-- Políticas para admin
CREATE POLICY "admin_all_whatsapptemplate" ON "WhatsappTemplate"
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Política de leitura pública para o serviço WhatsApp (se necessário)
-- O serviço usa service role key, então não precisa de policy para leitura

-- Templates padrão (seed)
-- NEW ORDER - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'new_order_customer',
    'Novo Pedido - Cliente',
    '🛒 *Pedido Recebido!*

Olá {{customerName}}!

Recebemos seu pedido #{{orderId}} no valor de {{amount}}.

⏳ Estamos aguardando a confirmação do pagamento. Assim que for aprovado, começaremos a preparar seu pedido.

Agradecemos a preferência! 💜',
    'CUSTOMER',
    'NEW_ORDER',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- NEW ORDER - Admin
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'new_order_admin',
    'Novo Pedido - Vendedor',
    '🛒 *Novo Pedido!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Valor: {{amount}}

Status: Aguardando pagamento',
    'ADMIN',
    'NEW_ORDER',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- PAYMENT APPROVED - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'payment_approved_customer',
    'Pagamento Aprovado - Cliente',
    '✅ *Pagamento Aprovado!*

Olá {{customerName}}!

Seu pagamento do pedido #{{orderId}} no valor de {{amount}} foi aprovado.

🧵 Agora vamos começar a preparar seu pedido com muito carinho!

Em breve enviaremos mais atualizações.',
    'CUSTOMER',
    'PAYMENT_APPROVED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- PAYMENT APPROVED - Admin
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'payment_approved_admin',
    'Pagamento Aprovado - Vendedor',
    '✅ *Pagamento Aprovado!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Valor: {{amount}}

O pagamento foi confirmado e o pedido está pronto para preparação.',
    'ADMIN',
    'PAYMENT_APPROVED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER PROCESSING - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_processing_customer',
    'Pedido em Preparação - Cliente',
    '🧵 *Pedido em Preparação!*

Olá {{customerName}}!

Seu pedido #{{orderId}} está sendo preparado com muito carinho.

Estamos bordando/separando todos os itens. Em breve ele será enviado!

Agradecemos a paciência. 💜',
    'CUSTOMER',
    'ORDER_PROCESSING',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER SHIPPED - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_shipped_customer',
    'Pedido Enviado - Cliente',
    '📦 *Pedido Enviado!*

Olá {{customerName}}!

Seu pedido #{{orderId}} foi enviado!

🚚 Código de rastreio: {{trackingCode}}

Você pode acompanhar pelo site dos Correios ou transportadora.

Obrigada por comprar conosco! 💜',
    'CUSTOMER',
    'ORDER_SHIPPED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER SHIPPED - Admin
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_shipped_admin',
    'Pedido Enviado - Vendedor',
    '📦 *Pedido Enviado!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Rastreio: {{trackingCode}}

O pedido foi marcado como enviado.',
    'ADMIN',
    'ORDER_SHIPPED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER DELIVERED - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_delivered_customer',
    'Pedido Entregue - Cliente',
    '🎉 *Pedido Entregue!*

Olá {{customerName}}!

Seu pedido #{{orderId}} foi entregue!

Esperamos que você ame seus produtos. 💜

Se puder, deixe uma avaliação na nossa loja. Sua opinião é muito importante!

Obrigada por comprar conosco!',
    'CUSTOMER',
    'ORDER_DELIVERED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER CANCELLED - Cliente
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_cancelled_customer',
    'Pedido Cancelado - Cliente',
    '❌ *Pedido Cancelado*

Olá {{customerName}}.

Infelizmente seu pedido #{{orderId}} no valor de {{amount}} foi cancelado.

Se você tiver alguma dúvida ou precisar de ajuda, entre em contato conosco.

Agradecemos a compreensão.',
    'CUSTOMER',
    'ORDER_CANCELLED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ORDER CANCELLED - Admin
INSERT INTO "WhatsappTemplate" ("id", "key", "name", "template", "recipientType", "event", "active", "isDefault", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'order_cancelled_admin',
    'Pedido Cancelado - Vendedor',
    '❌ *Pedido Cancelado*

Pedido: #{{orderId}}
Cliente: {{customerName}}

O pedido foi cancelado.',
    'ADMIN',
    'ORDER_CANCELLED',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);