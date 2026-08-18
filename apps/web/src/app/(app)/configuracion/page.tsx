'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { CatalogManager } from '@/components/catalog/catalog-manager';
import { type CompanyContract, CompanyContractsDialog } from '@/components/catalog/company-contracts-dialog';
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

function crearDisplayGlobalCompany(onVerContratos: (item: { [key: string]: unknown }) => void) {
  return function displayGlobalCompany(item: { [key: string]: unknown }) {
    const clients = (item.clients ?? []) as { id: string; name: string }[];
    const contratos = Number(item.contractCount ?? 0);
    return (
      <span className="flex flex-col">
        <span>{String(item.name)}</span>
        {(contratos > 0 || clients.length > 0) && (
          <span className="flex flex-wrap items-center gap-x-1 text-muted-foreground text-xs">
            {contratos > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerContratos(item);
                }}
                className="rounded text-brand hover:underline"
              >
                {contratos} contrato{contratos === 1 ? '' : 's'}
              </button>
            )}
            {contratos > 0 && clients.length > 0 && <span aria-hidden="true">·</span>}
            {clients.length > 0 && (
              <span>
                {clients.length} cliente{clients.length === 1 ? '' : 's'}: {clients.map((c) => c.name).join(', ')}
              </span>
            )}
          </span>
        )}
      </span>
    );
  };
}

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function detalleEmpresa(item: { [key: string]: unknown }) {
  const clients = (item.clients ?? []) as { id: string; name: string }[];
  const contratos = (item.contracts ?? []) as CompanyContract[];
  const porTitular = new Map<string, { holder: string; kind: string; total: number }>();
  for (const c of contratos) {
    const clave = `${c.kind}-${c.holder}`;
    const fila = porTitular.get(clave) ?? { holder: c.holder, kind: c.kind, total: 0 };
    fila.total += 1;
    porTitular.set(clave, fila);
  }
  const titulares = [...porTitular.values()].sort((a, b) => b.total - a.total || a.holder.localeCompare(b.holder));
  const web = text(item.website);
  return (
    <div className="space-y-3">
      <dl className="divide-y rounded-xl border text-sm">
        <LineaDetalle label="RUC" value={text(item.ruc) || '—'} />
        <LineaDetalle label="Razón social" value={text(item.legalName) || '—'} />
        <LineaDetalle
          label="Página web"
          value={
            web ? (
              <a href={web} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                {web}
              </a>
            ) : (
              '—'
            )
          }
        />
        <LineaDetalle label="Contratos" value={String(item.contractCount ?? 0)} />
        {titulares.length > 0 && (
          <div className="px-4 py-2.5">
            <p className="text-muted-foreground text-xs">Quién los tiene</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {titulares.map((t) => (
                <li key={`${t.kind}-${t.holder}`} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {t.holder}
                    {t.total > 1 && <span className="ml-1.5 text-muted-foreground text-xs">×{t.total}</span>}
                  </span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {t.kind === 'OWN' ? 'propio' : 'talento'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <LineaDetalle label="Clientes" value={String(clients.length)} />
      </dl>
      {clients.length > 0 && (
        <div className="rounded-xl border px-4 py-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Clientes que atiende</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {clients.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LineaDetalle({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium">{value}</dd>
    </div>
  );
}

function avisoBorrarEmpresa(item: { [key: string]: unknown }) {
  const clients = (item.clients ?? []) as { id: string; name: string }[];
  const contratos = Number(item.contractCount ?? 0);
  if (contratos > 0) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
        Tiene {contratos} contrato{contratos === 1 ? '' : 's'} asociado{contratos === 1 ? '' : 's'}, así que no se podrá
        eliminar.
      </p>
    );
  }
  if (!clients.length) return null;
  return (
    <>
      <div className="rounded-lg border bg-muted/30 px-3 py-2">
        <p className="font-medium text-foreground text-xs">
          {clients.length === 1
            ? 'Su cliente quedará sin empresa:'
            : `Sus ${clients.length} clientes quedarán sin empresa:`}
        </p>
        <ul className="mt-1 space-y-0.5">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5">
              <span className="size-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
              <span className="min-w-0 truncate">{c.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs">Si tiene movimientos, no se podrá eliminar.</p>
    </>
  );
}

function avisoBorrarCliente(item: { [key: string]: unknown }) {
  const company = item.globalCompany as { name: string } | null;
  if (!company) return null;
  return (
    <p>
      Está asociado a <span className="font-medium text-foreground">{company.name}</span> y se quitará de los contratos
      donde figure.
    </p>
  );
}

function searchGlobalCompany(item: { [key: string]: unknown }) {
  const clients = (item.clients ?? []) as { name: string }[];
  return [text(item.name), text(item.ruc), ...clients.map((c) => c.name)].join(' ');
}

function searchGlobalClient(item: { [key: string]: unknown }) {
  const company = item.globalCompany as { name: string } | null;
  return [text(item.name), company?.name ?? ''].join(' ');
}

function displayGlobalClient(item: { [key: string]: unknown }) {
  const companies = (item.companies ?? []) as { id: string; name: string }[];
  return (
    <span className="flex flex-col">
      <span>{String(item.name)}</span>
      {companies.length > 0 && (
        <span className="text-muted-foreground text-xs">{companies.map((c) => c.name).join(', ')}</span>
      )}
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

  const { data: globalClients } = useQuery({
    queryKey: queryKeys.globalClients(),
    queryFn: () => apiFetch<{ id: string; name: string }[]>('/global-clients'),
  });

  const [contratosDe, setContratosDe] = useState<{ name: string; contracts: CompanyContract[] } | null>(null);

  const displayEmpresa = useMemo(
    () =>
      crearDisplayGlobalCompany((item) =>
        setContratosDe({
          name: String(item.name),
          contracts: (item.contracts ?? []) as CompanyContract[],
        }),
      ),
    [],
  );

  const companyOptions = (globalCompanies ?? []).map((c) => ({ value: c.id, label: c.name }));
  const clientOptions = (globalClients ?? []).map((c) => ({ value: c.id, label: c.name }));

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
                  {
                    name: 'ruc',
                    label: 'RUC',
                    placeholder: '11 dígitos',
                    lookup: {
                      label: 'Buscar en SUNAT',
                      run: async (ruc: string) => {
                        const r = await apiFetch<{ ruc: string; legalName: string }>(`/ruc-lookup/${ruc}`);
                        return { ruc: r.ruc, legalName: r.legalName };
                      },
                    },
                  },
                  { name: 'legalName', label: 'Razón social', placeholder: 'Se completa al buscar el RUC' },
                  { name: 'website', label: 'Página web', placeholder: 'https://empresa.com' },
                  {
                    name: 'clientIds',
                    label: 'Clientes',
                    multi: true,
                    createField: 'newClientNames',
                    itemsKey: 'clients',
                    options: clientOptions,
                    placeholder: 'Sin clientes',
                  },
                ]}
                display={displayEmpresa}
                renderDetail={detalleEmpresa}
                deleteWarning={avisoBorrarEmpresa}
                alsoInvalidate={[queryKeys.globalClients()]}
                searchable
                searchText={searchGlobalCompany}
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
                  {
                    name: 'companyIds',
                    label: 'Empresas',
                    multi: true,
                    itemsKey: 'companies',
                    options: companyOptions,
                    placeholder: 'Sin empresas',
                  },
                ]}
                display={displayGlobalClient}
                deleteWarning={avisoBorrarCliente}
                alsoInvalidate={[queryKeys.globalCompanies()]}
                searchable
                searchText={searchGlobalClient}
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
            {/* MIMOTECH clasifica por aplicacion y proyecto, no por categorias. */}
            {activeWorkspace?.type !== 'BUSINESS' && (
              <Card>
                <CardContent className="pt-6">
                  <CatalogManager
                    title={activeWorkspace?.type === 'EMPLOYMENT' ? 'Conceptos' : 'Categorías'}
                    singular={activeWorkspace?.type === 'EMPLOYMENT' ? 'concepto' : 'categoría'}
                    articulo={activeWorkspace?.type === 'EMPLOYMENT' ? 'Nuevo' : 'Nueva'}
                    endpoint="/categories"
                    queryKey={queryKeys.categories(ws)}
                    extraBody={{ workspaceId: ws }}
                    fields={[{ name: 'name', label: 'Nombre', required: true }]}
                    display={(c) => String(c.name ?? '')}
                  />
                </CardContent>
              </Card>
            )}
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
      <CompanyContractsDialog
        companyName={contratosDe?.name ?? null}
        contracts={contratosDe?.contracts ?? []}
        onOpenChange={(next) => !next && setContratosDe(null)}
      />
    </PageShell>
  );
}
