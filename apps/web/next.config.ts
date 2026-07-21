import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@korapay/domain', '@korapay/ui'],
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
};

export default nextConfig;
