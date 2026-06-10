import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { protocol, hostname } = new URL(supabaseUrl);
      if (hostname && (protocol === "http:" || protocol === "https:")) {
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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.mercadopago.com https://*.mercadopago.com https://http2.mlstatic.com https://*.mlstatic.com",
      "style-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://http2.mlstatic.com https://*.mlstatic.com https://fonts.gstatic.com",
      "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com https://http2.mlstatic.com https://*.mlstatic.com https://www.mercadolibre.com https://*.mercadolibre.com https://events.mercadopago.com https://supabase.bordadeiras.cloud",
      "frame-src 'self' https://youtube.com https://www.youtube.com https://*.youtube.com https://youtube-nocookie.com https://www.youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.google.com https://*.gstatic.com https://*.mercadopago.com https://www.mercadolibre.com https://*.mercadolibre.com https://*.mlstatic.com",
      "child-src 'self' https://youtube.com https://www.youtube.com https://*.youtube.com https://youtube-nocookie.com https://www.youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.google.com https://*.mercadopago.com https://www.mercadolibre.com https://*.mercadolibre.com https://*.mlstatic.com",
      "frame-ancestors 'self'",
    ].join("; "),
  },
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
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.google.com https://player.vimeo.com https://*.vimeo.com; style-src 'unsafe-inline';",
          },
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
