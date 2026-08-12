import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { NetworkStatus } from '@/components/layout/network-status';
import { PWABanner } from '@/components/layout/pwa-banner';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'KoraPay — Gestión financiera inteligente',
  description: 'Organiza tus finanzas personales y empresariales con KoraPay',
  applicationName: 'KoraPay',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KoraPay',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // El tema claro usa crema y el oscuro azul profundo: la barra del navegador
  // sigue al tema activo en vez de quedarse fija en uno.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#161A28' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        {/* Next 15 solo emite mobile-web-app-capable; iOS antiguo sigue leyendo
            la variante con prefijo apple para abrir en modo standalone. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {children}
            <Toaster richColors closeButton position="top-right" />
            <PWABanner />
            <NetworkStatus />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
