import type { NextConfig } from "next";

const isNetlify = process.env.NETLIFY === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isNetlify ? '' : '/BaseballLineup',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
