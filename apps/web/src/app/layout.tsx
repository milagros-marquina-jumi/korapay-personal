import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Providers } from './providers';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});
export const metadata: Metadata = {
  title: 'KoraPay — Gestion financiera inteligente',
  description: 'Organiza tus finanzas personales y empresariales con KoraPay',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      {' '}
      <body className="min-h-screen bg-background font-sans antialiased">
        {' '}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {' '}
          <Providers>
            {' '}
            <AppShell>{children}</AppShell> <Toaster richColors closeButton position="top-right" />{' '}
          </Providers>{' '}
        </ThemeProvider>{' '}
      </body>{' '}
    </html>
  );
}
