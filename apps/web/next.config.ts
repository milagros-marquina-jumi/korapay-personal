const nextConfig = {
  transpilePackages: ['@korapay/domain', '@korapay/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
};
export default nextConfig;
