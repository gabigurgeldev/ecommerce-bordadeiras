import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const PLACEHOLDER_IMAGE = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=800&q=80`;

async function main() {
  console.log("🌱 Seeding Ecommerce Bordadeiras…");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@bordadeiras.com.br").trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD ?? "Admin@123456").trim();
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Administrador", role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      name: "Administrador",
      role: Role.ADMIN,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-admin-address" },
    update: {},
    create: {
      id: "seed-admin-address",
      userId: admin.id,
      label: "Loja",
      recipientName: "Bordadeiras LTDA",
      phone: "11999990000",
      zipCode: "01310100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      isDefault: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "maquinas-bordado" },
      update: {},
      create: {
        name: "Máquinas de Bordado",
        slug: "maquinas-bordado",
        description: "Máquinas residenciais e comerciais para bordado computadorizado.",
        sortOrder: 1,
        imageUrl: PLACEHOLDER_IMAGE("1581092160601-ee22621dd758"),
      },
    }),
    prisma.category.upsert({
      where: { slug: "linhas-e-fios" },
      update: {},
      create: {
        name: "Linhas e Fios",
        slug: "linhas-e-fios",
        description: "Linhas de poliéster, rayon e kits multicoloridos.",
        sortOrder: 2,
        imageUrl: PLACEHOLDER_IMAGE("1558171813-810577eb5a9e"),
      },
    }),
    prisma.category.upsert({
      where: { slug: "acessorios" },
      update: {},
      create: {
        name: "Acessórios",
        slug: "acessorios",
        description: "Bastidores, agulhas, estabilizadores e ferramentas.",
        sortOrder: 3,
        imageUrl: PLACEHOLDER_IMAGE("1615529328331-f891af771dfa"),
      },
    }),
  ]);

  const productsData = [
    {
      name: "Máquina de Bordado Brother NV1800Q",
      slug: "brother-nv1800q",
      sku: "BR-NV1800Q",
      priceCents: 899900,
      compareCents: 999900,
      stock: 5,
      categoryId: categories[0].id,
      description:
        "Máquina de bordado com área de 18x30 cm, 180 designs embutidos e conexão USB.",
      images: [
        { url: PLACEHOLDER_IMAGE("1581092160601-ee22621dd758"), alt: "Brother NV1800Q", isPrimary: true },
        { url: PLACEHOLDER_IMAGE("1581092929636-94d27a8e7f48"), alt: "Detalhe da área de bordado" },
      ],
    },
    {
      name: "Kit 60 Linhas Poliéster Premium",
      slug: "kit-60-linhas-poliester",
      sku: "LN-KIT60",
      priceCents: 18990,
      compareCents: 24990,
      stock: 120,
      categoryId: categories[1].id,
      description: "Kit com 60 cores de linha poliéster 40wt para bordado e costura.",
      images: [{ url: PLACEHOLDER_IMAGE("1558171813-810577eb5a9e"), alt: "Kit de linhas", isPrimary: true }],
    },
    {
      name: "Bastidor Magnético 15x15 cm",
      slug: "bastidor-magnetico-15",
      sku: "AC-BST15",
      priceCents: 7990,
      stock: 80,
      categoryId: categories[2].id,
      description: "Bastidor magnético compatível com máquinas de braço único.",
      images: [{ url: PLACEHOLDER_IMAGE("1615529328331-f891af771dfa"), alt: "Bastidor magnético", isPrimary: true }],
    },
    {
      name: "Estabilizador Tear Away 50 folhas",
      slug: "estabilizador-tear-away-50",
      sku: "AC-EST50",
      priceCents: 4590,
      stock: 200,
      categoryId: categories[2].id,
      description: "Estabilizador para bordado em tecidos leves, 50 folhas 20x30 cm.",
      images: [{ url: PLACEHOLDER_IMAGE("1615484473149-5978253e3810"), alt: "Estabilizador", isPrimary: true }],
    },
  ];

  for (const p of productsData) {
    const { images, ...productFields } = p;
    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: {
        ...productFields,
        status: ProductStatus.ACTIVE,
        active: true,
      },
      create: {
        ...productFields,
        status: ProductStatus.ACTIVE,
        active: true,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((img, index) => ({
        productId: product.id,
        url: img.url,
        alt: img.alt,
        sortOrder: index,
        isPrimary: img.isPrimary ?? index === 0,
      })),
    });
  }

  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: {
      code: "BEMVINDO10",
      type: "PERCENT",
      value: 10,
      minCents: 5000,
      maxUses: 500,
      active: true,
    },
  });

  const blogCategory = await prisma.blogCategory.upsert({
    where: { slug: "dicas-e-tutoriais" },
    update: {},
    create: { name: "Dicas e Tutoriais", slug: "dicas-e-tutoriais" },
  });

  const tagBordado = await prisma.blogTag.upsert({
    where: { slug: "bordado" },
    update: {},
    create: { name: "Bordado", slug: "bordado" },
  });

  const tagIniciante = await prisma.blogTag.upsert({
    where: { slug: "iniciante" },
    update: {},
    create: { name: "Iniciante", slug: "iniciante" },
  });

  const posts = [
    {
      title: "Como escolher sua primeira máquina de bordado",
      slug: "primeira-maquina-de-bordado",
      excerpt: "Guia prático para iniciantes que querem investir no bordado computadorizado.",
      content: `<p>O bordado computadorizado transformou ateliês e pequenos negócios. Neste guia, comparamos área de bordado, número de agulhas e conectividade.</p><p>Para quem está começando, modelos com área de 10x10 cm a 18x30 cm oferecem ótimo custo-benefício.</p>`,
      coverImage: PLACEHOLDER_IMAGE("1581092160601-ee22621dd758"),
    },
    {
      title: "5 erros comuns ao usar estabilizador",
      slug: "erros-estabilizador-bordado",
      excerpt: "Evite deformações e falhas no acabamento com estas dicas de estabilização.",
      content: `<p>O estabilizador correto depende do tecido e do tipo de desenho. Tear away funciona bem em algodão; cut away é ideal para malhas.</p>`,
      coverImage: PLACEHOLDER_IMAGE("1615484473149-5978253e3810"),
    },
  ];

  for (const post of posts) {
    const created = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        ...post,
        published: true,
        publishedAt: new Date(),
        categoryId: blogCategory.id,
      },
      create: {
        ...post,
        published: true,
        publishedAt: new Date(),
        categoryId: blogCategory.id,
      },
    });

    await prisma.blogPostTag.deleteMany({ where: { postId: created.id } });
    await prisma.blogPostTag.createMany({
      data: [
        { postId: created.id, tagId: tagBordado.id },
        { postId: created.id, tagId: tagIniciante.id },
      ],
    });
  }

  const emailTemplates = [
    {
      key: "pedido-confirmado",
      name: "Pedido confirmado",
      subject: "Pedido {{orderNumber}} confirmado — Bordadeiras",
      htmlBody: "<h1>Olá {{customerName}}</h1><p>Recebemos seu pedido <strong>{{orderNumber}}</strong>.</p>",
      textBody: "Olá {{customerName}}, seu pedido {{orderNumber}} foi confirmado.",
    },
    {
      key: "pedido-enviado",
      name: "Pedido enviado",
      subject: "Seu pedido {{orderNumber}} foi enviado",
      htmlBody: "<p>Seu pedido foi despachado. Código de rastreio: {{trackingCode}}</p>",
      textBody: "Pedido enviado. Rastreio: {{trackingCode}}",
    },
    {
      key: "recuperacao-senha",
      name: "Recuperação de senha",
      subject: "Redefinir sua senha — Bordadeiras",
      htmlBody: "<p>Clique no link para redefinir sua senha: {{resetLink}}</p>",
      textBody: "Redefina sua senha: {{resetLink}}",
    },
  ];

  for (const tpl of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: tpl,
      create: tpl,
    });
  }

  const settings = [
    { key: "store.name", value: "Bordadeiras", group: "store" },
    { key: "store.email", value: "contato@bordadeiras.com.br", group: "store" },
    { key: "store.phone", value: "+55 11 99999-0000", group: "store" },
    { key: "shipping.freeAboveCents", value: "29900", group: "shipping" },
    { key: "mercadopago.public_key", value: "", group: "mercadopago" },
    { key: "mercadopago.access_token", value: "", group: "mercadopago" },
    { key: "mercadopago.webhook_secret", value: "", group: "mercadopago" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { group: s.group },
      create: s,
    });
  }

  await prisma.whatsappRecipient.upsert({
    where: { id: "seed-recipient-example" },
    update: {},
    create: {
      id: "seed-recipient-example",
      label: "Exemplo (inativo)",
      phone: "5511999990000",
      active: false,
    },
  });

  const bannerCount = await prisma.storefrontBanner.count();
  if (bannerCount === 0) {
    await prisma.storefrontBanner.createMany({
      data: [
        {
          title: "Hero principal",
          imageUrl:
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80",
          link: "/loja",
          sortOrder: 0,
          active: true,
        },
        {
          title: "Máquinas de bordado",
          imageUrl:
            "https://images.unsplash.com/photo-1581092160601-ee22621dd758?w=1920&q=80",
          link: "/loja/categoria/maquinas-bordado",
          sortOrder: 1,
          active: true,
        },
      ],
    });
    console.log("   Banners da home: 2 exemplos criados.");
  }

  const trustCount = await prisma.storefrontTrustItem.count();
  if (trustCount === 0) {
    await prisma.storefrontTrustItem.createMany({
      data: [
        {
          title: "Pagamento Seguro",
          description: "Ambiente protegido e criptografado",
          icon: "badge-check",
          sortOrder: 0,
          active: true,
        },
        {
          title: "Frete Grátis",
          description: "Em compras acima de R$ 199",
          icon: "truck",
          sortOrder: 1,
          active: true,
        },
        {
          title: "Troca Garantida",
          description: "Até 7 dias após o recebimento",
          icon: "rotate-ccw",
          sortOrder: 2,
          active: true,
        },
        {
          title: "Atendimento via WhatsApp",
          description: "Suporte rápido e humano",
          icon: "headphones",
          sortOrder: 3,
          active: true,
        },
      ],
    });
    console.log("   Barra de confiança: 4 itens padrão criados.");
  }

  console.log("✅ Seed concluído.");
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
