-- Novos eventos de template WhatsApp (deve rodar em migration separada dos INSERTs)

ALTER TYPE "WhatsappTemplateEvent" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "WhatsappTemplateEvent" ADD VALUE IF NOT EXISTS 'ABANDONED_CART';
ALTER TYPE "WhatsappTemplateEvent" ADD VALUE IF NOT EXISTS 'CUSTOM_OUTREACH';
