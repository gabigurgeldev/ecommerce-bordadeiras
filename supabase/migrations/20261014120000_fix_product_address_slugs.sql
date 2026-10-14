-- Corrige slugs de produto que não são URL-safe. O autofill do navegador
-- preenchia o campo "Endereço na loja (slug)" do admin com o endereço do usuário
-- (ex.: "Avenida Nova República, Bairro ..."), quebrando /produto/[slug] com 404.
-- Regera o slug a partir do nome; idempotente (só toca slugs fora do padrão).
DO $$
DECLARE
  p RECORD;
  base TEXT;
  candidate TEXT;
BEGIN
  FOR p IN
    SELECT "id", "name" FROM "Product"
    WHERE "slug" !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ORDER BY "createdAt"
  LOOP
    base := trim(both '-' from regexp_replace(
      lower(translate(p."name",
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')),
      '[^a-z0-9]+', '-', 'g'));
    IF base = '' THEN
      base := 'produto';
    END IF;

    candidate := base;
    IF EXISTS (SELECT 1 FROM "Product" WHERE "slug" = candidate AND "id" <> p."id") THEN
      candidate := base || '-' || left(md5(p."id"), 6);
    END IF;

    UPDATE "Product" SET "slug" = candidate, "updatedAt" = now() WHERE "id" = p."id";
  END LOOP;
END $$;
