-- Migration: Atualizar tabela StorefrontBanner para suportar imagens responsive
-- Criado em: 2025-06-06

-- Adicionar novas colunas para imagens responsive
ALTER TABLE "StorefrontBanner" 
ADD COLUMN IF NOT EXISTS "desktopImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "mobileImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "altText" TEXT;

-- Migrar dados existentes (imageUrl -> desktopImageUrl)
UPDATE "StorefrontBanner" 
SET "desktopImageUrl" = "imageUrl"
WHERE "desktopImageUrl" IS NULL AND "imageUrl" IS NOT NULL;

-- Tornar desktopImageUrl obrigatório apenas se houver registros
-- Primeiro verificamos se existem banners sem desktopImageUrl
DO $$
BEGIN
  -- Só torna obrigatório se todos os registros tiverem desktopImageUrl preenchido
  IF NOT EXISTS (
    SELECT 1 FROM "StorefrontBanner" 
    WHERE "desktopImageUrl" IS NULL
  ) THEN
    ALTER TABLE "StorefrontBanner" 
    ALTER COLUMN "desktopImageUrl" SET NOT NULL;
  END IF;
END $$;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN "StorefrontBanner"."desktopImageUrl" IS 'URL da imagem para desktop (proporção 21:9)';
COMMENT ON COLUMN "StorefrontBanner"."mobileImageUrl" IS 'URL da imagem para mobile (proporção 16:9) - opcional';
COMMENT ON COLUMN "StorefrontBanner"."altText" IS 'Texto alternativo para acessibilidade';
