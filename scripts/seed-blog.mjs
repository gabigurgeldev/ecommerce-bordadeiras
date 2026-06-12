/**
 * Popula dados de exemplo do blog no Supabase (pt-BR).
 * Uso: node --env-file=.env.local scripts/seed-blog.mjs
 *
 * Requer migrations 20260612100000_blog_system e user admin (npm run db:seed).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = new Date().toISOString();
const authorId = "user_admin_seed";

const categories = [
  {
    id: "bcat_dicas",
    name: "Dicas de Bordado",
    slug: "dicas-de-bordado",
    description: "Técnicas, materiais e boas práticas para quem borda no dia a dia.",
    icon: "lightbulb",
    postsCount: 0,
    isActive: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "bcat_maquinas",
    name: "Máquinas & Equipamentos",
    slug: "maquinas-equipamentos",
    description: "Manutenção, configuração e escolha de bordadeiras.",
    icon: "cpu",
    postsCount: 0,
    isActive: true,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "bcat_tendencias",
    name: "Tendências",
    slug: "tendencias",
    description: "Novidades do mercado, cores da estação e inspirações.",
    icon: "sparkle",
    postsCount: 0,
    isActive: true,
    sortOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
];

const tags = [
  { id: "btag_iniciantes", name: "Iniciantes", slug: "iniciantes", createdAt: now },
  { id: "btag_manutencao", name: "Manutenção", slug: "manutencao", createdAt: now },
  { id: "btag_linhas", name: "Linhas", slug: "linhas", createdAt: now },
  { id: "btag_producao", name: "Produção", slug: "producao", createdAt: now },
  { id: "btag_design", name: "Design", slug: "design", createdAt: now },
  { id: "btag_tendencias", name: "Tendências", slug: "tendencias", createdAt: now },
];

const posts = [
  {
    id: "bpost_guia_linhas",
    title: "Guia completo de linhas para bordado computadorizado",
    slug: "guia-linhas-bordado-computadorizado",
    excerpt:
      "Rayon, poliéster ou algodão? Entenda qual linha usar em cada tipo de peça e evite quebras na produção.",
    content:
      "<p>Escolher a linha certa é tão importante quanto calibrar a tensão da máquina.</p>",
    coverImage:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    published: true,
    status: "PUBLISHED",
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    seoTitle: "Guia de linhas para bordado | Bordadeiras",
    seoDescription: "Comparativo de linhas rayon, poliéster e algodão para bordado computadorizado.",
    views: 342,
    readingTime: 6,
    categoryId: "bcat_dicas",
    authorId,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: now,
  },
  {
    id: "bpost_manutencao_mensal",
    title: "Checklist de manutenção mensal da bordadeira",
    slug: "checklist-manutencao-mensal-bordadeira",
    excerpt: "Cinco passos simples para manter cabeçotes, eixos e lubrificação em dia.",
    content: "<p>Reserve uma manhã por mês para inspecionar agulhas e lubrificar pontos críticos.</p>",
    coverImage:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    published: true,
    status: "PUBLISHED",
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    views: 189,
    readingTime: 4,
    categoryId: "bcat_maquinas",
    authorId,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: now,
  },
  {
    id: "bpost_cores_2026",
    title: "Paleta de cores para bordado — tendências 2026",
    slug: "paleta-cores-bordado-2026",
    excerpt: "Terracota, verde musgo e azul profundo dominam as coleções deste ano.",
    content: "<p>As tendências de 2026 valorizam tons naturais e contrastes suaves.</p>",
    coverImage:
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
    published: true,
    status: "PUBLISHED",
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    views: 97,
    readingTime: 3,
    categoryId: "bcat_tendencias",
    authorId,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: now,
  },
  {
    id: "bpost_rascunho_estabilizadores",
    title: "Como escolher estabilizadores (rascunho)",
    slug: "como-escolher-estabilizadores",
    excerpt: "Rascunho em elaboração sobre tear-away, cut-away e water-soluble.",
    content: "<p>Conteúdo em edição.</p>",
    coverImage:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
    published: false,
    status: "DRAFT",
    views: 0,
    readingTime: 5,
    categoryId: "bcat_dicas",
    authorId,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: now,
  },
];

const postTags = [
  { postId: "bpost_guia_linhas", tagId: "btag_linhas" },
  { postId: "bpost_guia_linhas", tagId: "btag_iniciantes" },
  { postId: "bpost_manutencao_mensal", tagId: "btag_manutencao" },
  { postId: "bpost_manutencao_mensal", tagId: "btag_producao" },
  { postId: "bpost_cores_2026", tagId: "btag_design" },
  { postId: "bpost_cores_2026", tagId: "btag_tendencias" },
];

async function main() {
  console.log("Seed blog →", url);

  const { error: catErr } = await db.from("BlogCategory").upsert(categories, { onConflict: "id" });
  if (catErr) throw new Error(`BlogCategory: ${catErr.message}`);
  console.log(`✓ ${categories.length} categorias do blog`);

  const { error: tagErr } = await db.from("BlogTag").upsert(tags, { onConflict: "id" });
  if (tagErr) throw new Error(`BlogTag: ${tagErr.message}`);
  console.log(`✓ ${tags.length} tags`);

  const { error: postErr } = await db.from("BlogPost").upsert(posts, { onConflict: "id" });
  if (postErr) throw new Error(`BlogPost: ${postErr.message}`);
  console.log(`✓ ${posts.length} posts`);

  for (const pt of postTags) {
    const { error } = await db.from("BlogPostTag").upsert(pt, { onConflict: "postId,tagId" });
    if (error) throw new Error(`BlogPostTag: ${error.message}`);
  }
  console.log(`✓ ${postTags.length} relações post-tag`);

  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
