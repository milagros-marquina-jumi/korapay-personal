'use client';

import Link from 'next/link';
import { FOOTER_LINKS } from '@/components/landing/landing-data';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link href="/" aria-label="KoraPay, inicio">
          <Logo size={30} />
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {FOOTER_LINKS.slice(0, 3).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto md:ml-0">
          <Button asChild size="sm">
            <Link href="/dashboard">Entrar</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t px-4 py-10 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <Logo size={26} />
          <p className="mt-2 text-muted-foreground text-xs">Gestión financiera personal y de negocio.</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-muted-foreground text-xs">
          Un producto de{' '}
          <a
            href="https://mimotech.vip"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline decoration-brand/40 underline-offset-4 transition-colors hover:text-brand"
          >
            MIMOTECH
          </a>
        </p>
      </div>
    </footer>
  );
}
