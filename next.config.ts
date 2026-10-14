import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-heavy admin/scanner app — prefer request-time rendering.
  cacheComponents: false,
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
