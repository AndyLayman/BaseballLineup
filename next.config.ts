import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isVercel ? '' : '/BaseballLineup',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
