import { cn } from '@/lib/utils';

interface Props {
  owner?: string | null;
  viewer?: 'ADMIN' | 'TALENT';
  talentName?: string;
  adminName?: string;
  className?: string;
}

/** Version larga, con nombres: para el detalle y el formulario. */
export function debtOwnerLabel(
  owner: string | null | undefined,
  viewer: 'ADMIN' | 'TALENT',
  talentName?: string,
  adminName?: string,
): string {
  const talento = talentName?.trim() || 'el talento';
  const admin = adminName?.trim() || 'la empresa';
  const meDebe = owner !== 'MINE';
  if (viewer === 'TALENT') return meDebe ? `Le debo a ${admin}` : `${admin} me debe`;
  return meDebe ? `${talento} me debe` : `Le debo a ${talento}`;
}

/** Version corta para las tablas, donde el nombre se repite en cada fila. */
export function debtOwnerShort(owner: string | null | undefined): string {
  return owner === 'MINE' ? 'Le debo' : 'Me deben';
}

export function DebtOwnerBadge({ owner, viewer = 'ADMIN', talentName, adminName, className }: Readonly<Props>) {
  const meDebe = owner !== 'MINE';
  return (
    <span
      title={debtOwnerLabel(owner, viewer, talentName, adminName)}
      className={cn(
        'inline-flex whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[11px]',
        meDebe ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning',
        className,
      )}
    >
      {debtOwnerShort(owner)}
    </span>
  );
}
