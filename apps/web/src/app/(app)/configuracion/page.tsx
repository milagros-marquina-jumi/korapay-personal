'use client';

import { CatalogManager } from '@/components/catalog/catalog-manager';
import { ExchangeRatePanel } from '@/components/catalog/exchange-rate-panel';
import { WorkspaceManager } from '@/components/catalog/workspace-manager';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryKeys } from '@/lib/query-keys';

export default function ConfiguracionPage() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const ws = activeWorkspaceId ?? '';

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Workspaces, tipo de cambio y catálogos" />

      <Tabs defaultValue="workspaces">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="cambio">Tipo de cambio</TabsTrigger>
          <TabsTrigger value="globales">Catálogos globales</TabsTrigger>
          <TabsTrigger value="workspace">Catálogos del workspace</TabsTrigger>
        </TabsList>

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
                display={(b) => String(b.name)}
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
            <Card>
              <CardContent className="pt-6">
                <CatalogManager
                  title="Empresas"
                  endpoint="/companies"
                  queryKey={queryKeys.companies(ws)}
                  extraBody={{ workspaceId: ws }}
                  fields={[
                    { name: 'name', label: 'Nombre', required: true },
                    { name: 'ruc', label: 'RUC' },
                    { name: 'industry', label: 'Industria' },
                  ]}
                  display={(c) => String(c.name)}
                />
              </CardContent>
            </Card>
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
    </div>
  );
}
