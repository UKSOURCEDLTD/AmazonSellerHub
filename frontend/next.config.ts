import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/manual_amazon_sync',
        destination: 'http://localhost:5001/manual_amazon_sync',
      },
    ];
  },
};

export default nextConfig;
