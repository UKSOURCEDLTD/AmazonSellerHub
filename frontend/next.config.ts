import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
