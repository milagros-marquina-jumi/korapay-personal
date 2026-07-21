'use client';

import { EmptyState } from '@korapay/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';

const TYPE_LABEL: Record<string, string> = {
  PERSONAL: 'Personal',
  EMPLOYMENT: 'Ingresos Laborales',
  BUSINESS: 'MIMOTECH',
  SHARED: 'Compartido',
};

export function WorkspaceGate({ type, children }: { type: string | string[]; children: ReactNode }) {
  const { activeWorkspace, isLoading } = useWorkspace();

  if (isLoading || !activeWorkspace) return null;

  const allowed = Array.isArray(type) ? type : [type];
  if (!allowed.includes(activeWorkspace.type)) {
    const label = allowed.map((t) => TYPE_LABEL[t] ?? t).join(' o ');
    return (
      <EmptyState
        title={`Esta seccion pertenece a ${label}`}
        description={`Cambia a un workspace ${label} desde el selector para verla.`}
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
