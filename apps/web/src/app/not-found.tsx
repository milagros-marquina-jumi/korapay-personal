import { FileQuestion } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-card">
          <FileQuestion className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="font-display text-5xl font-bold text-brand">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe o cambió de dirección.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
