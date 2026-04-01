import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/BaseballLineup',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
