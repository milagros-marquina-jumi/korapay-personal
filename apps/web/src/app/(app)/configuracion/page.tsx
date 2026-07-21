'use client';

import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfiguracionPage() {
  const { workspaces } = useWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracion" description="Perfil, workspaces y preferencias" />

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-brand-soft text-lg font-semibold text-brand">MM</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">Milagros Marquina</p>
            <p className="text-sm text-muted-foreground">demo@korapay.local</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {workspaces.length ? (
            workspaces.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {ws.emoji}
                  </span>
                  <span className="text-sm font-medium">{ws.name}</span>
                </div>
                <Badge variant="secondary">{ws.type}</Badge>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin workspaces</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El tema claro y oscuro se controla desde el interruptor de la barra superior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
