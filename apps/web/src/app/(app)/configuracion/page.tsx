'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, CurrencyCatalog, ExchangeRateInfo, PaymentMethodCatalog } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export default function ConfiguracionPage() {
  const { workspaces } = useWorkspace();

  const { data: currencies } = useQuery({
    queryKey: queryKeys.currencies(),
    queryFn: () => apiFetch<CurrencyCatalog[]>('/currencies'),
  });
  const { data: methods } = useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: () => apiFetch<PaymentMethodCatalog[]>('/payment-methods'),
  });
  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
  });
  const { data: rate } = useQuery({
    queryKey: queryKeys.exchangeRate(),
    queryFn: () => apiFetch<ExchangeRateInfo | null>('/exchange-rate'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracion" description="Perfil, workspaces y catalogos globales" />

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="catalogos">Catalogos</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
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
              <CardTitle>Preferencias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                El tema claro y oscuro se controla desde el interruptor de la barra superior.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces">
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
                      <div>
                        <p className="text-sm font-medium">{ws.name}</p>
                        {ws.description && <p className="text-xs text-muted-foreground">{ws.description}</p>}
                      </div>
                    </div>
                    <Badge variant="secondary">{ws.type}</Badge>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin workspaces</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalogos" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de cambio</CardTitle>
            </CardHeader>
            <CardContent>
              {rate ? (
                <p className="text-2xl font-bold tabular-nums">
                  1 {rate.from} = {rate.rate} {rate.to}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Sin tipo de cambio</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monedas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {currencies?.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.symbol} {c.code}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Medios de pago</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {methods?.map((m) => (
                <Badge key={m.id} variant="secondary">
                  {m.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bancos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {banks?.map((b) => (
                <Badge key={b.id} variant="secondary">
                  {b.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
