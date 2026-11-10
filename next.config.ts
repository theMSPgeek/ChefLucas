import type { NextConfig } from "next";

const imageHosts = [
  "msgsndr.com",
  "**.msgsndr.com",
  "storage.googleapis.com",
  "**.storage.googleapis.com",
  "leadconnectorhq.com",
  "**.leadconnectorhq.com",
  "gohighlevel.com",
  "**.gohighlevel.com",
  "highlevel.com",
  "**.highlevel.com",
  "firebasestorage.googleapis.com",
  "**.googleusercontent.com",
  "cdn.filestackcontent.com",
  "assets.cdn.filesafe.space",
  "**.filesafe.space",
] as const;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      port: "",
      pathname: "/**",
    })),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
