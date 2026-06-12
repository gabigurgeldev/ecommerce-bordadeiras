-- Seed idempotente: blog demo em pt-BR (categorias, tags, posts, comentários, mídia, versão)
-- Requer user_admin_seed (npm run db:seed) ou ajuste authorId manualmente.

INSERT INTO "BlogCategory" (
  "id", "name", "slug", "description", "icon", "postsCount", "isActive", "sortOrder",
  "createdAt", "updatedAt"
)
VALUES
  (
    'bcat_dicas',
    'Dicas de Bordado',
    'dicas-de-bordado',
    'Técnicas, materiais e boas práticas para quem borda no dia a dia.',
    'lightbulb',
    0,
    true,
    1,
    NOW(),
    NOW()
  ),
  (
    'bcat_maquinas',
    'Máquinas & Equipamentos',
    'maquinas-equipamentos',
    'Manutenção, configuração e escolha de bordadeiras.',
    'cpu',
    0,
    true,
    2,
    NOW(),
    NOW()
  ),
  (
    'bcat_tendencias',
    'Tendências',
    'tendencias',
    'Novidades do mercado, cores da estação e inspirações.',
    'sparkle',
    0,
    true,
    3,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "BlogTag" ("id", "name", "slug", "createdAt")
VALUES
  ('btag_iniciantes', 'Iniciantes', 'iniciantes', NOW()),
  ('btag_manutencao', 'Manutenção', 'manutencao', NOW()),
  ('btag_linhas', 'Linhas', 'linhas', NOW()),
  ('btag_producao', 'Produção', 'producao', NOW()),
  ('btag_design', 'Design', 'design', NOW()),
  ('btag_tendencias', 'Tendências', 'tendencias', NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug";

INSERT INTO "BlogPost" (
  "id", "title", "slug", "excerpt", "content", "coverImage", "youtubeUrl",
  "published", "status", "publishedAt", "seoTitle", "seoDescription",
  "views", "readingTime", "categoryId", "authorId", "createdAt", "updatedAt"
)
VALUES
  (
    'bpost_guia_linhas',
    'Guia completo de linhas para bordado computadorizado',
    'guia-linhas-bordado-computadorizado',
    'Rayon, poliéster ou algodão? Entenda qual linha usar em cada tipo de peça e evite quebras na produção.',
    '<p>Escolher a linha certa é tão importante quanto calibrar a tensão da máquina. Para peças delicadas, o <strong>rayon</strong> oferece brilho e maciez. Já o <strong>poliéster</strong> resiste melhor a lavagens industriais.</p><p>Na Bordadeiras, recomendamos testar sempre em um retalho antes de iniciar lotes grandes. Registre a combinação agulha + linha + estabilizador — isso economiza horas de retrabalho.</p>',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80',
    NULL,
    true,
    'PUBLISHED',
    NOW() - INTERVAL '10 days',
    'Guia de linhas para bordado | Bordadeiras',
    'Comparativo de linhas rayon, poliéster e algodão para bordado computadorizado.',
    342,
    6,
    'bcat_dicas',
    'user_admin_seed',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'bpost_manutencao_mensal',
    'Checklist de manutenção mensal da bordadeira',
    'checklist-manutencao-mensal-bordadeira',
    'Cinco passos simples para manter cabeçotes, eixos e lubrificação em dia — e evitar paradas na produção.',
    '<p>Reserve uma manhã por mês para inspecionar agulhas, limpar resíduos de linha e aplicar óleo nos pontos indicados pelo fabricante.</p><p>Não esqueça de verificar o alinhamento do bastidor e a tensão dos cabos. Pequenos ajustes preventivos evitam custos altos com assistência técnica.</p>',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    'PUBLISHED',
    NOW() - INTERVAL '5 days',
    'Manutenção mensal de bordadeira',
    'Checklist prático de manutenção preventiva para bordadeiras industriais e compactas.',
    189,
    4,
    'bcat_maquinas',
    'user_admin_seed',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'bpost_cores_2026',
    'Paleta de cores para bordado — tendências 2026',
    'paleta-cores-bordado-2026',
    'Terracota, verde musgo e azul profundo dominam as coleções deste ano. Veja como aplicar na sua grade de produção.',
    '<p>As tendências de 2026 valorizam tons naturais e contrastes suaves. Combine linhas mate com pontos densos para destacar logos e monogramas.</p><p>Para bonés e streetwear, aposte em degradês com duas ou três cores da mesma família.</p>',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80',
    NULL,
    true,
    'PUBLISHED',
    NOW() - INTERVAL '2 days',
    'Cores de bordado 2026',
    'Tendências de cores para bordado computadorizado em 2026.',
    97,
    3,
    'bcat_tendencias',
    'user_admin_seed',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'bpost_rascunho_estabilizadores',
    'Como escolher estabilizadores (rascunho)',
    'como-escolher-estabilizadores',
    'Rascunho em elaboração sobre tear-away, cut-away e water-soluble.',
    '<p>Conteúdo em edição. Em breve: guia completo sobre estabilizadores para diferentes tecidos.</p>',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    NULL,
    false,
    'DRAFT',
    NULL,
    NULL,
    NULL,
    0,
    5,
    'bcat_dicas',
    'user_admin_seed',
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "slug" = EXCLUDED."slug",
  "excerpt" = EXCLUDED."excerpt",
  "content" = EXCLUDED."content",
  "coverImage" = EXCLUDED."coverImage",
  "youtubeUrl" = EXCLUDED."youtubeUrl",
  "published" = EXCLUDED."published",
  "status" = EXCLUDED."status",
  "publishedAt" = EXCLUDED."publishedAt",
  "seoTitle" = EXCLUDED."seoTitle",
  "seoDescription" = EXCLUDED."seoDescription",
  "views" = EXCLUDED."views",
  "readingTime" = EXCLUDED."readingTime",
  "categoryId" = EXCLUDED."categoryId",
  "authorId" = EXCLUDED."authorId",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "BlogPostTag" ("postId", "tagId")
VALUES
  ('bpost_guia_linhas', 'btag_linhas'),
  ('bpost_guia_linhas', 'btag_iniciantes'),
  ('bpost_manutencao_mensal', 'btag_manutencao'),
  ('bpost_manutencao_mensal', 'btag_producao'),
  ('bpost_cores_2026', 'btag_design'),
  ('bpost_cores_2026', 'btag_tendencias')
ON CONFLICT DO NOTHING;

INSERT INTO "BlogComment" (
  "id", "postId", "authorName", "authorEmail", "content", "isApproved", "parentId", "createdAt"
)
VALUES
  (
    'bcom_1',
    'bpost_guia_linhas',
    'Mariana Silva',
    'mariana@email.com',
    'Excelente explicação! Comecei com rayon e tive muito menos quebras de linha.',
    true,
    NULL,
    NOW() - INTERVAL '8 days'
  ),
  (
    'bcom_2',
    'bpost_guia_linhas',
    'Equipe Bordadeiras',
    'contato@bordadeiras.com.br',
    'Obrigado, Mariana! Temos kits de linhas rayon no catálogo se quiser experimentar novas cores.',
    true,
    'bcom_1',
    NOW() - INTERVAL '7 days'
  ),
  (
    'bcom_3',
    'bpost_manutencao_mensal',
    'Carlos Mendes',
    'carlos@email.com',
    'O checklist ajudou muito. Vocês vendem o óleo lubrificante indicado?',
    false,
    NULL,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT ("id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "isApproved" = EXCLUDED."isApproved";

INSERT INTO "BlogMedia" (
  "id", "postId", "type", "url", "altText", "sortOrder", "createdAt"
)
VALUES
  (
    'bmed_1',
    'bpost_guia_linhas',
    'IMAGE',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    'Bobinas de linha coloridas organizadas',
    0,
    NOW()
  ),
  (
    'bmed_2',
    'bpost_manutencao_mensal',
    'YOUTUBE',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'Vídeo: lubrificação do cabeçote',
    0,
    NOW()
  ),
  (
    'bmed_3',
    'bpost_cores_2026',
    'IMAGE',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80',
    'Amostras de cores para bordado',
    0,
    NOW()
  )
ON CONFLICT ("id") DO UPDATE SET
  "url" = EXCLUDED."url",
  "altText" = EXCLUDED."altText",
  "sortOrder" = EXCLUDED."sortOrder";

INSERT INTO "BlogPostVersion" (
  "id", "postId", "versionNumber", "title", "slug", "excerpt", "content",
  "coverImage", "youtubeUrl", "seoTitle", "seoDescription", "categoryId",
  "status", "tagIds", "notes", "createdById", "createdAt"
)
VALUES
  (
    'bver_1',
    'bpost_rascunho_estabilizadores',
    1,
    'Como escolher estabilizadores (rascunho)',
    'como-escolher-estabilizadores',
    'Primeira versão salva automaticamente.',
    '<p>Versão inicial do rascunho sobre estabilizadores.</p>',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    NULL,
    NULL,
    NULL,
    'bcat_dicas',
    'DRAFT',
    '["btag_iniciantes"]'::jsonb,
    'Auto-save ao criar rascunho',
    'user_admin_seed',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT ("id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "notes" = EXCLUDED."notes";

-- Refresh postsCount (trigger may not fire on seed upsert in all cases)
UPDATE "BlogCategory" bc
SET "postsCount" = sub.cnt
FROM (
  SELECT bp."categoryId" AS id, COUNT(*)::INTEGER AS cnt
  FROM "BlogPost" bp
  WHERE bp."categoryId" IS NOT NULL
    AND bp."status" = 'PUBLISHED'::"BlogPostStatus"
    AND bp."deletedAt" IS NULL
  GROUP BY bp."categoryId"
) sub
WHERE bc."id" = sub.id;
