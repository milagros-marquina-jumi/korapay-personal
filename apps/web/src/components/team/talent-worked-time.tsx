import type { Talent } from '@/lib/api.types';
import { computeWorkedTime } from '@/lib/talent-worked-time';
import { formatDurationDays } from '@/lib/utils';

interface TalentWorkedTimeProps {
  readonly talent: Talent;
}

export function TalentWorkedTime({ talent }: TalentWorkedTimeProps) {
  if (!talent.startedWithMeAt) return null;

  const { workedDays, idleDays, neverPlaced } = computeWorkedTime(
    talent.startedWithMeAt,
    talent.endedWithMeAt,
    talent.contracts,
  );

  return (
    <>
      <div className="pointer-events-none flex items-center justify-between">
        <span className="text-muted-foreground">Tiempo colocado</span>
        <span className="font-medium">
          {neverPlaced ? <span className="text-warning">Nunca colocado</span> : formatDurationDays(workedDays)}
        </span>
      </div>
      {idleDays > 0 && (
        <div className="pointer-events-none flex items-center justify-between">
          <span className="text-muted-foreground">Sin trabajo</span>
          <span className="font-medium text-muted-foreground">{formatDurationDays(idleDays)}</span>
        </div>
      )}
    </>
  );
}
