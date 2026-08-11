'use client';

import { Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MONTH_NAMES } from '@/lib/months';

export interface CompaniesMonthSelection {
  year: string;
  monthIndex: number | null;
  companies: { name: string; clients: string[] }[];
}

interface Props {
  selection: CompaniesMonthSelection | null;
  onOpenChange: (open: boolean) => void;
}

export function CompaniesMonthDialog({ selection, onOpenChange }: Readonly<Props>) {
  const companies = selection?.companies ?? [];
  let title = '';
  if (selection) {
    title =
      selection.monthIndex === null
        ? `Empresas en ${selection.year}`
        : `${MONTH_NAMES[selection.monthIndex]} ${selection.year}`;
  }

  return (
    <Dialog open={!!selection} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{title}</DialogTitle>
          <DialogDescription>
            {companies.length} empresa{companies.length === 1 ? '' : 's'}{' '}
            {selection?.monthIndex === null ? 'distintas en el año' : 'con ingresos en el mes'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {companies.map((c) => (
            <div key={c.name} className="rounded-lg border px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4 text-brand" />
                {c.name}
              </div>
              {c.clients.length > 0 && (
                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                  Cliente{c.clients.length === 1 ? '' : 's'}: {c.clients.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
