import type { BlogPost, Category, Product } from "@/lib/types/catalog";

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Máquinas de Bordado",
    slug: "maquinas",
    description: "Equipamentos profissionais e compactos",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    productCount: 4,
  },
  {
    id: "cat-2",
    name: "Linhas & Fios",
    slug: "linhas",
    description: "Rayon, poliéster e cores exclusivas",
    imageUrl:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80",
    productCount: 3,
  },
  {
    id: "cat-3",
    name: "Acessórios",
    slug: "acessorios",
    description: "Bastidores, agulhas e manutenção",
    imageUrl:
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=80",
    productCount: 3,
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Bordadeira Pro X12 — 12 agulhas",
    slug: "bordadeira-pro-x12",
    description:
      "Máquina industrial de 12 agulhas com área de bordado ampliada, ideal para produção em série e peças de alto volume.",
    shortDescription: "12 agulhas · Área 500×400mm",
    priceCents: 8990000,
    compareAtCents: 9490000,
    sku: "BRD-X12",
    stock: 5,
    stockUnlimited: false,
    showPrice: true,
    featured: true,
    categoryId: "cat-1",
    categorySlug: "maquinas",
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    ],
    tags: ["destaque", "industrial"],
    specs: { Agulhas: "12", Área: "500×400mm", Velocidade: "1200 rpm" },
  },
  {
    id: "prod-2",
    name: "Bordadeira Compacta Home 6",
    slug: "bordadeira-compacta-home-6",
    description:
      "Modelo silencioso para ateliês e pequenos negócios. Interface intuitiva e suporte a arquivos DST/PES.",
    shortDescription: "6 agulhas · Ideal para ateliê",
    priceCents: 4590000,
    stock: 12,
    stockUnlimited: false,
    showPrice: true,
    featured: true,
    categoryId: "cat-1",
    categorySlug: "maquinas",
    images: [
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    ],
    tags: ["destaque"],
  },
  {
    id: "prod-3",
    name: "Kit Linhas Rayon Premium 60 cores",
    slug: "kit-linhas-rayon-60",
    description: "Kit completo com bobinas 500m, brilho intenso e alta resistência à lavagem.",
    priceCents: 189000,
    stock: 40,
    stockUnlimited: false,
    showPrice: true,
    featured: true,
    categoryId: "cat-2",
    categorySlug: "linhas",
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    ],
    tags: ["destaque"],
  },
  {
    id: "prod-4",
    name: "Bastidor Magnético 24×24cm",
    slug: "bastidor-magnetico-24",
    description: "Fixação rápida e estável para bonés e peças planas.",
    priceCents: 34900,
    stock: 80,
    stockUnlimited: false,
    showPrice: true,
    featured: false,
    categoryId: "cat-3",
    categorySlug: "acessorios",
    images: [
      "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80",
    ],
  },
  {
    id: "prod-5",
    name: "Agulhas DBxK5 — Caixa 100un",
    slug: "agulhas-dbxk5-100",
    description: "Agulhas industriais para tecidos médios e grossos.",
    priceCents: 8900,
    stock: 200,
    stockUnlimited: false,
    showPrice: true,
    featured: false,
    categoryId: "cat-3",
    categorySlug: "acessorios",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
    ],
  },
  {
    id: "prod-6",
    name: "Óleo Lubrificante Industrial 1L",
    slug: "oleo-lubrificante-1l",
    description: "Manutenção preventiva para cabeçotes e eixos.",
    priceCents: 12900,
    stock: 60,
    stockUnlimited: false,
    showPrice: true,
    featured: false,
    categoryId: "cat-3",
    categorySlug: "acessorios",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee226afe6bb8?w=1200&q=80",
    ],
  },
  {
    id: "prod-7",
    name: "Linha Poliéster 5000m — Branco",
    slug: "linha-poliester-5000-branco",
    description: "Bobina industrial para produção contínua.",
    priceCents: 4500,
    stock: 150,
    stockUnlimited: false,
    showPrice: true,
    featured: false,
    categoryId: "cat-2",
    categorySlug: "linhas",
    images: [
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    ],
  },
];

export const mockTestimonials = [
  {
    id: "t1",
    name: "Mariana Silva",
    role: "Ateliê Mariana Bordados",
    text: "A Pro X12 transformou nossa produção. Suporte impecável e entrega rápida.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Carlos Mendes",
    role: "Uniformes CM",
    text: "Linhas com cor estável e acabamento perfeito. Recomendo a Bordadeiras.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Ana Paula Rocha",
    role: "Designer têxtil",
    text: "Comprei a compacta Home 6 para começar — interface simples e resultados profissionais.",
    rating: 5,
  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "Como escolher sua primeira máquina de bordado",
    slug: "como-escolher-primeira-maquina",
    excerpt:
      "Guia prático para ateliês e pequenos negócios: agulhas, área de bordado e formatos de arquivo.",
    content: `<p>Investir na máquina certa define o ritmo do seu ateliê. Avalie volume de produção, tipos de peça e suporte técnico local.</p><h2>Área de bordado</h2><p>Para bonés e peças pequenas, modelos compactos bastam. Para jaquetas e backs, priorize área ampla.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
    author: "Equipe Bordadeiras",
    publishedAt: "2026-05-15T10:00:00.000Z",
    tags: ["guia", "máquinas"],
  },
  {
    id: "blog-2",
    title: "Manutenção preventiva: checklist mensal",
    slug: "manutencao-preventiva-checklist",
    excerpt:
      "Prolongue a vida útil do equipamento com lubrificação, limpeza e calibração.",
    content: `<p>Uma rotina simples evita paradas na produção. Reserve um dia por mês para inspeção completa.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
    author: "Equipe Bordadeiras",
    publishedAt: "2026-05-01T10:00:00.000Z",
    tags: ["manutenção"],
  },
  {
    id: "blog-3",
    title: "Tendências de bordado 2026",
    slug: "tendencias-bordado-2026",
    excerpt: "Cores, texturas e aplicações que estão em alta no mercado brasileiro.",
    content: `<p>Minimalismo com fio metalizado e patches 3D seguem em destaque.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80",
    author: "Equipe Bordadeiras",
    publishedAt: "2026-04-20T10:00:00.000Z",
    tags: ["tendências"],
  },
];
