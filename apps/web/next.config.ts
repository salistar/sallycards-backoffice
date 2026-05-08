import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    '@sally/types',
    '@sally/game-engine',
    '@sally/ui',
    '@sally/card-assets',
    '@sally/i18n',
    '@sally/networking',
    '@sally/ai',
    '@sally/auth',
    '@sally/audio',
    '@sally/storage',
    '@sally/social',
  ],
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
