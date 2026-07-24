import type { NextConfig } from "next";

// Host self-hosted do Supabase Storage. Fallback fixo porque os remotePatterns
// do next/image são assados no build; se NEXT_PUBLIC_SUPABASE_URL não chegar como
// build arg (EasyPanel injeta env só em runtime), o host ficaria de fora e o
// next/image lançaria exceção ao renderizar imagens do storage.
const FALLBACK_SUPABASE_HOST = "supabase.bordadeiras.cloud";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
    {
      protocol: "https",
      hostname: FALLBACK_SUPABASE_HOST,
      pathname: "/storage/v1/object/public/**",
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { protocol, hostname } = new URL(supabaseUrl);
      if (
        hostname &&
        hostname !== FALLBACK_SUPABASE_HOST &&
        (protocol === "http:" || protocol === "https:")
      ) {
        patterns.push({
          protocol: protocol.replace(":", "") as "http" | "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        });
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  return patterns;
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  images: {
    // O image optimizer (/_next/image) não funciona no runtime standalone do
    // EasyPanel — retorna 404 para qualquer host remoto, quebrando todas as
    // imagens e derrubando o server render de <Image priority> (páginas de
    // artigo). Servir a URL original direto contorna o optimizer defeituoso.
    // remotePatterns fica como allowlist de fallback caso a otimização volte.
    unoptimized: true,
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/((?!embed/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
