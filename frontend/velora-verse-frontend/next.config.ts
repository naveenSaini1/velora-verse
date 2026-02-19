import type { NextConfig } from "next";

const frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8002";
const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8002",
        pathname: "/files/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8003",
        pathname: "/files/**",
      },
      {
        protocol: "https",
        hostname: "veloraverse.com",
        pathname: "/files/**",
      },
      {
        protocol: "https",
        hostname: "interval-pour-wider-dial.trycloudflare.com",
        pathname: "/files/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
  async rewrites() {
    if (!useApiProxy) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${frappeUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
