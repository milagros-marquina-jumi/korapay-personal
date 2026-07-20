'use client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Plus, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface TalentProfile {
  id: string;
  name: string;
  status: string;
}
export default function MimotalentsPage() {
  const { data: talents, isLoading } = useQuery({
    queryKey: ['talents'],
    queryFn: () => apiFetch<TalentProfile[]>('/talents?workspaceId=mimotalents'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">Mimotalents</h1>{' '}
          <p className="text-sm text-muted-foreground">Gestion de talentos y contratos</p>{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nuevo Talento{' '}
        </button>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {' '}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : talents?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {' '}
          {talents.map((talent) => (
            <div key={talent.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
                  {' '}
                  <Users className="h-5 w-5 text-brand" />{' '}
                </div>{' '}
                <div>
                  {' '}
                  <h3 className="font-medium">{talent.name}</h3>{' '}
                  <div className="flex items-center gap-2 mt-0.5">
                    {' '}
                    <Briefcase className="h-3 w-3 text-muted-foreground" />{' '}
                    <span className="text-xs text-muted-foreground">
                      {talent.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
              <div className="mt-4 flex gap-2">
                {' '}
                <a
                  href={`/mimotalents/talentos/${talent.id}`}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-medium hover:bg-accent"
                >
                  {' '}
                  Ver detalle{' '}
                </a>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
          {' '}
          <Users className="h-12 w-12 text-muted-foreground/50" />{' '}
          <p className="mt-4 text-sm text-muted-foreground">No hay talentos registrados</p>{' '}
        </div>
      )}{' '}
    </div>
  );
}
