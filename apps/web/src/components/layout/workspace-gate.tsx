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
};

export function WorkspaceGate({ type, children }: { type: string; children: ReactNode }) {
  const { activeWorkspace, isLoading } = useWorkspace();

  if (isLoading || !activeWorkspace) return null;

  if (activeWorkspace.type !== type) {
    return (
      <EmptyState
        title={`Esta seccion pertenece a ${TYPE_LABEL[type] ?? type}`}
        description={`Cambia al workspace ${TYPE_LABEL[type] ?? type} desde el selector para verla.`}
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
