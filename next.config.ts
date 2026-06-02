import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  ];

  for (const raw of [process.env.S3_PUBLIC_URL, process.env.S3_ENDPOINT]) {
    if (!raw) continue;
    try {
      const { protocol, hostname } = new URL(raw);
      if (hostname && (protocol === "http:" || protocol === "https:")) {
        patterns.push({
          protocol: protocol.replace(":", "") as "http" | "https",
          hostname,
          pathname: "/**",
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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com",
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
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  poweredByHeader: false,
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
