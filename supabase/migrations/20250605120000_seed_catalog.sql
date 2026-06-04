-- Seed idempotente: catálogo demo Bordadeiras (rode uma vez após foundation)
-- Ou use: npm run db:seed (com service_role no .env.local)

INSERT INTO "Category" ("id", "name", "slug", "description", "imageUrl", "sortOrder", "active", "createdAt", "updatedAt")
VALUES
  ('cat_maquinas', 'Máquinas de Bordado', 'maquinas', 'Equipamentos profissionais e compactos',
   'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80', 1, true, NOW(), NOW()),
  ('cat_linhas', 'Linhas & Fios', 'linhas', 'Rayon, poliéster e cores exclusivas',
   'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80', 2, true, NOW(), NOW()),
  ('cat_acessorios', 'Acessórios', 'acessorios', 'Bastidores, agulhas e manutenção',
   'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80', 3, true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "imageUrl" = EXCLUDED."imageUrl",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = EXCLUDED."active",
  "updatedAt" = NOW();

-- Produtos: use npm run db:seed para imagens em ProductImage (mais simples que SQL puro)
