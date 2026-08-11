interface SequenceBadgeProps {
  readonly sequence?: number;
  readonly total?: number;
}

const ORDINALS = ['', 'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto'];

export function SequenceBadge({ sequence, total }: SequenceBadgeProps) {
  if (!sequence || !total || total < 2) return null;

  const ordinal = ORDINALS[sequence] ?? `${sequence}º`;

  return (
    <span
      className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      title={`${ordinal} contrato de ${total} con esta empresa`}
    >
      {sequence} de {total}
    </span>
  );
}
