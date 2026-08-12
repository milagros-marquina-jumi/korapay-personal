import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@korapay/domain', '@korapay/ui'],
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: { document: '/offline' },
  workboxOptions: {
    disableDevLogs: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    // Con skipWaiting el SW nuevo se activa solo y nunca queda en "waiting",
    // asi que el banner de actualizacion no llegaria a mostrarse. En false,
    // Workbox escucha SKIP_WAITING y es el usuario quien decide recargar.
    skipWaiting: false,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Datos de dinero nunca se cachean: servir un saldo o un movimiento viejo
      // desde cache induce a error en decisiones financieras.
      {
        urlPattern:
          /\/api\/v1\/(transactions|accounts|debts|saving-balances|saving-goals|talent-ledger|tax-obligations|detected-transactions|dashboard|reports|portal|profile)\b/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/v1\//i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: ({ request }) => request.method === 'GET' && request.destination === 'document',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 10 },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
