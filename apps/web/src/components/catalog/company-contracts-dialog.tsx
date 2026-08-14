'use client';

import { StatusBadge } from '@korapay/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

export interface CompanyContract {
  id: string;
  kind: 'OWN' | 'TALENT';
  holder: string;
  talentId?: string | null;
  position?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
}

interface Props {
  companyName: string | null;
  contracts: CompanyContract[];
  onOpenChange: (open: boolean) => void;
}

export function CompanyContractsDialog({ companyName, contracts, onOpenChange }: Readonly<Props>) {
  const mios = contracts.filter((c) => c.kind === 'OWN');
  const deTalentos = contracts.filter((c) => c.kind === 'TALENT');

  return (
    <Dialog open={companyName !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">Contratos en {companyName}</DialogTitle>
          <DialogDescription>
            {contracts.length} contrato{contracts.length === 1 ? '' : 's'} en total
          </DialogDescription>
        </DialogHeader>

        {mios.length > 0 && <Grupo titulo="Tuyos" contratos={mios} />}
        {deTalentos.length > 0 && <Grupo titulo="De talentos" contratos={deTalentos} />}
        {contracts.length === 0 && (
          <p className="px-3 py-6 text-center text-muted-foreground text-sm">Sin contratos registrados</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Grupo({ titulo, contratos }: Readonly<{ titulo: string; contratos: CompanyContract[] }>) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {titulo} ({contratos.length})
      </p>
      <div className="divide-y rounded-xl border">
        {contratos.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.holder}</span>
              <span className="block truncate text-muted-foreground text-xs">
                {c.position || 'Sin cargo'} · {formatDate(c.startDate)} —{' '}
                {c.endDate ? formatDate(c.endDate) : 'sigue activo'}
              </span>
            </span>
            <StatusBadge status={c.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
