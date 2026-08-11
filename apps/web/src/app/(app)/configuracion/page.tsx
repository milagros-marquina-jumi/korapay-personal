'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { CatalogManager } from '@/components/catalog/catalog-manager';
import { ExchangeRatePanel } from '@/components/catalog/exchange-rate-panel';
import { WorkspaceManager } from '@/components/catalog/workspace-manager';
import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { SavingBucketsManager } from '@/components/savings/saving-buckets-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface GlobalCompanyItem {
  id: string;
  name: string;
  clients?: { id: string; name: string }[];
}

function displayGlobalCompany(item: { [key: string]: unknown }) {
  const clients = (item.clients ?? []) as { id: string; name: string }[];
  return (
    <span className="flex flex-col">
      <span>{String(item.name)}</span>
      {clients.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {clients.length} cliente{clients.length === 1 ? '' : 's'}: {clients.map((c) => c.name).join(', ')}
        </span>
      )}
    </span>
  );
}

function displayGlobalClient(item: { [key: string]: unknown }) {
  const company = item.globalCompany as { name: string } | null;
  return (
    <span className="flex flex-col">
      <span>{String(item.name)}</span>
      {company && <span className="text-xs text-muted-foreground">{company.name}</span>}
    </span>
  );
}

export default function ConfiguracionPage() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const ws = activeWorkspaceId ?? '';

  const { data: globalCompanies } = useQuery({
    queryKey: queryKeys.globalCompanies(),
    queryFn: () => apiFetch<GlobalCompanyItem[]>('/global-companies'),
  });

  const companyOptions = (globalCompanies ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <PageShell title="Configuración" description="Workspaces, tipo de cambio y catálogos">
      <Tabs defaultValue="workspaces">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="cambio">Tipo de cambio</TabsTrigger>
          <TabsTrigger value="globales">Catálogos globales</TabsTrigger>
          <TabsTrigger value="workspace">Catálogos del workspace</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="integraciones" className="grid gap-4 md:grid-cols-2">
          <Link href="/configuracion/integraciones/correo">
            <Card className="h-full transition-shadow hover:shadow-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="size-5 text-brand" /> Correos bancarios
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Conecta tus correos mediante Google Apps Script para importar consumos automáticamente.
              </CardContent>
            </Card>
          </Link>
          <Link href="/configuracion/reglas-conciliacion">
            <Card className="h-full transition-shadow hover:shadow-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="size-5 text-brand" /> Reglas de conciliación
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Asigna automáticamente workspace, cuenta y categoría según el comercio.
              </CardContent>
            </Card>
          </Link>
        </TabsContent>

        <TabsContent value="workspaces">
          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkspaceManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cambio">
          <ExchangeRatePanel />
        </TabsContent>

        <TabsContent value="globales" className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <CatalogManager
                title="Medios de pago"
                endpoint="/payment-methods"
                queryKey={queryKeys.paymentMethods()}
                fields={[{ name: 'name', label: 'Nombre', required: true }]}
                display={(m) => String(m.name)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CatalogManager
                title="Bancos"
                endpoint="/banks"
                queryKey={queryKeys.banks()}
                fields={[
                  { name: 'name', label: 'Nombre', required: true },
                  { name: 'country', label: 'País', placeholder: 'PE' },
                ]}
                display={(b) => (
                  <span>
                    {String(b.name)}
                    {b.country ? <span className="ml-2 text-xs text-muted-foreground">{String(b.country)}</span> : null}
                  </span>
                )}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CatalogManager
                title="Empresas"
                endpoint="/global-companies"
                queryKey={queryKeys.globalCompanies()}
                fields={[
                  { name: 'name', label: 'Nombre', required: true },
                  { name: 'ruc', label: 'RUC', placeholder: 'Opcional' },
                ]}
                display={displayGlobalCompany}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CatalogManager
                title="Clientes"
                endpoint="/global-clients"
                queryKey={queryKeys.globalClients()}
                fields={[
                  { name: 'name', label: 'Nombre', required: true },
                  { name: 'globalCompanyId', label: 'Empresa', options: companyOptions },
                ]}
                display={displayGlobalClient}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <CatalogManager
                title="Monedas"
                endpoint="/currencies"
                queryKey={queryKeys.currencies()}
                fields={[
                  { name: 'code', label: 'Código', required: true, placeholder: 'PEN' },
                  { name: 'symbol', label: 'Símbolo', required: true, placeholder: 'S/' },
                  { name: 'name', label: 'Nombre', required: true },
                ]}
                display={(c) => `${c.symbol} ${c.code} — ${c.name}`}
                editable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Catálogos de <span className="font-medium text-foreground">{activeWorkspace?.name}</span>. Cambia de
            workspace en el selector para gestionar los de otro.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <CatalogManager
                  title="Categorías"
                  endpoint="/categories"
                  queryKey={queryKeys.categories(ws)}
                  extraBody={{ workspaceId: ws }}
                  fields={[
                    { name: 'name', label: 'Nombre', required: true },
                    { name: 'emoji', label: 'Emoji', placeholder: '📁' },
                  ]}
                  display={(c) => `${c.emoji ?? ''} ${c.name}`}
                />
              </CardContent>
            </Card>
            {(activeWorkspace?.type === 'PERSONAL' || activeWorkspace?.type === 'SHARED') && (
              <Card>
                <CardContent className="pt-6">
                  <SavingBucketsManager />
                </CardContent>
              </Card>
            )}
            {activeWorkspace?.type === 'BUSINESS' && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <CatalogManager
                      title="Aplicaciones"
                      endpoint="/applications"
                      queryKey={queryKeys.applications(ws)}
                      extraBody={{ workspaceId: ws }}
                      fields={[
                        { name: 'name', label: 'Nombre', required: true },
                        { name: 'provider', label: 'Proveedor' },
                        { name: 'category', label: 'Categoría' },
                      ]}
                      display={(a) => String(a.name)}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <CatalogManager
                      title="Proyectos"
                      endpoint="/projects"
                      queryKey={queryKeys.projects(ws)}
                      extraBody={{ workspaceId: ws }}
                      fields={[
                        { name: 'name', label: 'Nombre', required: true },
                        { name: 'description', label: 'Descripción' },
                        { name: 'emoji', label: 'Emoji', placeholder: '📦' },
                      ]}
                      display={(p) => `${p.emoji ?? ''} ${p.name}`}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <CatalogManager
                      title="Personas (equipo)"
                      endpoint="/people"
                      queryKey={queryKeys.people(ws)}
                      extraBody={{ workspaceId: ws, kind: 'TEAM' }}
                      fields={[
                        { name: 'name', label: 'Nombre', required: true },
                        { name: 'email', label: 'Email' },
                        { name: 'phone', label: 'Teléfono' },
                      ]}
                      display={(p) => String(p.name)}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
