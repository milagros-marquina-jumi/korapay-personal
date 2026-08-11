'use client';

import { useEffect, useRef, useState } from 'react';
import { FILTER_ALL } from '@/components/data-table/filter-select';

/**
 * Preselecciona el anio en curso una vez que llegan los anios disponibles.
 * Si el anio actual no tiene datos, cae al mas reciente.
 */
export function useDefaultYear(years: number[] | undefined) {
  const [year, setYear] = useState(FILTER_ALL);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !years?.length) return;
    initialized.current = true;
    const current = new Date().getUTCFullYear();
    const target = years.includes(current) ? current : Math.max(...years);
    setYear(String(target));
  }, [years]);

  return [year, setYear] as const;
}
