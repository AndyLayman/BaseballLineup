import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';
const isGitHubPages = !isVercel;

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/BaseballLineup' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
