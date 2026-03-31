// apps/admin/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@agp/config', '@agp/scoring', '@agp/validation'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uscgtpvdgcgrfzvccnwq.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

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
