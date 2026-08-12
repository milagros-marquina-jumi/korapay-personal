import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/logo';

// Portal de talento accesible por token: expone pagos y deudas de una persona.
// noindex + nofollow + noarchive para que no quede rastro en buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 md:px-6">
          <Logo size={30} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
