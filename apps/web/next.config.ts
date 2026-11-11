import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sitio 100 % estático (apps/web/out) para Cloudflare Pages.
  output: "export",
  images: { unoptimized: true },
  // @bus/shared es un paquete interno que se consume como TypeScript fuente.
  transpilePackages: ["@bus/shared"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
