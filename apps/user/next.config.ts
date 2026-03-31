// apps/user/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workspace packages that need to be transpiled
  transpilePackages: ['@agp/config', '@agp/scoring', '@agp/validation'],

  // Production image domains (Supabase storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uscgtpvdgcgrfzvccnwq.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Security headers applied at Next.js level
  // (Vercel-level headers also set in vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
