/**
 * Popula catálogo inicial no Supabase (categorias, produtos, imagens, admin).
 * Uso: node --env-file=.env.local scripts/seed-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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

const categories = [
  {
    id: "cat_maquinas",
    name: "Máquinas de Bordado",
    slug: "maquinas",
    description: "Equipamentos profissionais e compactos",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    sortOrder: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat_linhas",
    name: "Linhas & Fios",
    slug: "linhas",
    description: "Rayon, poliéster e cores exclusivas",
    imageUrl:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80",
    sortOrder: 2,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat_acessorios",
    name: "Acessórios",
    slug: "acessorios",
    description: "Bastidores, agulhas e manutenção",
    imageUrl:
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    sortOrder: 3,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

const products = [
  {
    id: "prod_bordadeira_x12",
    name: "Bordadeira Pro X12 — 12 agulhas",
    slug: "bordadeira-pro-x12",
    description:
      "Máquina industrial de 12 agulhas com área de bordado ampliada, ideal para produção em série e peças de alto volume.",
    sku: "BRD-X12",
    priceCents: 8990000,
    compareCents: 9490000,
    stock: 5,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_maquinas",
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    ],
  },
  {
    id: "prod_bordadeira_home6",
    name: "Bordadeira Compacta Home 6",
    slug: "bordadeira-compacta-home-6",
    description:
      "Modelo silencioso para ateliês e pequenos negócios. Interface intuitiva e suporte a arquivos DST/PES.",
    sku: "BRD-HOME6",
    priceCents: 4590000,
    compareCents: 4990000,
    stock: 12,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_maquinas",
    images: [
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    ],
  },
  {
    id: "prod_kit_rayon60",
    name: "Kit Linhas Rayon Premium 60 cores",
    slug: "kit-linhas-rayon-60",
    description:
      "Kit completo com bobinas 500m, brilho intenso e alta resistência à lavagem.",
    sku: "LIN-RAYON60",
    priceCents: 189000,
    compareCents: 219000,
    stock: 40,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_linhas",
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    ],
  },
  {
    id: "prod_bastidor_24",
    name: "Bastidor Magnético 24×24cm",
    slug: "bastidor-magnetico-24",
    description: "Fixação rápida e estável para bonés e peças planas.",
    sku: "ACC-BAST24",
    priceCents: 34900,
    stock: 80,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_acessorios",
    images: [
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
    ],
  },
  {
    id: "prod_agulhas_100",
    name: "Agulhas DBxK5 — Caixa 100un",
    slug: "agulhas-dbxk5-100",
    description: "Agulhas industriais para tecidos médios e grossos.",
    sku: "ACC-AG100",
    priceCents: 8900,
    stock: 200,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_acessorios",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
    ],
  },
  {
    id: "prod_oleo_1l",
    name: "Óleo Lubrificante Industrial 1L",
    slug: "oleo-lubrificante-1l",
    description: "Manutenção preventiva para cabeçotes e eixos.",
    sku: "ACC-OLEO1L",
    priceCents: 12900,
    stock: 60,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_acessorios",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee226afe6bb8?w=1200&q=80",
    ],
  },
  {
    id: "prod_linha_branco",
    name: "Linha Poliéster 5000m — Branco",
    slug: "linha-poliester-5000-branco",
    description: "Bobina industrial para produção contínua.",
    sku: "LIN-POL-BR",
    priceCents: 4500,
    stock: 150,
    status: "ACTIVE",
    active: true,
    categoryId: "cat_linhas",
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    ],
  },
];

async function upsertCategories() {
  const { error } = await db.from("Category").upsert(categories, { onConflict: "id" });
  if (error) throw new Error(`Category: ${error.message}`);
  console.log(`✓ ${categories.length} categorias`);
}

async function upsertProducts() {
  for (const p of products) {
    const { images, ...row } = p;
    const payload = {
      ...row,
      images: images,
      createdAt: now,
      updatedAt: now,
    };
    const { error } = await db.from("Product").upsert(payload, { onConflict: "id" });
    if (error) throw new Error(`Product ${p.slug}: ${error.message}`);

    await db.from("ProductImage").delete().eq("productId", p.id);
    const imageRows = images.map((url, idx) => ({
      id: `img_${p.id}_${idx}`,
      productId: p.id,
      url,
      alt: p.name,
      sortOrder: idx,
      isPrimary: idx === 0,
      createdAt: now,
    }));
    const { error: imgErr } = await db.from("ProductImage").insert(imageRows);
    if (imgErr) throw new Error(`ProductImage ${p.slug}: ${imgErr.message}`);
  }
  console.log(`✓ ${products.length} produtos + imagens`);
}

async function upsertAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@bordadeiras.com.br")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";
  const hash = await bcrypt.hash(password, 12);
  const { error } = await db.from("User").upsert(
    {
      id: "user_admin_seed",
      email,
      name: "Administrador",
      role: "ADMIN",
      passwordHash: hash,
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    },
    { onConflict: "email" },
  );
  if (error) throw new Error(`User: ${error.message}`);
  console.log(`✓ admin ${email}`);
}

async function main() {
  console.log("Seed Supabase →", url);
  await upsertCategories();
  await upsertProducts();
  await upsertAdmin();
  console.log("Concluído. Recarregue http://localhost:3000");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
