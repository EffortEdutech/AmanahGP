import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // amanahOS — Governance Workspace for Organizations
  // Part of the AmanahGP monorepo (apps/org)
  // Local port: 3302
  transpilePackages: ['@agp/config', '@agp/scoring', '@agp/validation'],
};

export default nextConfig;
