import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "msgsndr.com", pathname: "/**" },
      { protocol: "https", hostname: "**.msgsndr.com", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "**.storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "leadconnectorhq.com", pathname: "/**" },
      { protocol: "https", hostname: "**.leadconnectorhq.com", pathname: "/**" },
      { protocol: "https", hostname: "gohighlevel.com", pathname: "/**" },
      { protocol: "https", hostname: "**.gohighlevel.com", pathname: "/**" },
      { protocol: "https", hostname: "highlevel.com", pathname: "/**" },
      { protocol: "https", hostname: "**.highlevel.com", pathname: "/**" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "**.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.filestackcontent.com", pathname: "/**" },
      { protocol: "https", hostname: "assets.cdn.filesafe.space", pathname: "/**" },
      { protocol: "https", hostname: "**.filesafe.space", pathname: "/**" },
    ],
  },
};

export default nextConfig;
