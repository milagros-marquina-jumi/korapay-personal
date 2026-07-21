'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface MoneyInputProps {
  id?: string;
  value: string;
  onValueChange: (raw: string) => void;
  placeholder?: string;
  maxIntegerDigits?: number;
  maxDecimalDigits?: number;
  className?: string;
}

function groupThousands(raw: string): string {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const grouped = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}

export function MoneyInput({
  id,
  value,
  onValueChange,
  placeholder = '0.000',
  maxIntegerDigits = 10,
  maxDecimalDigits = 3,
  className,
}: MoneyInputProps) {
  const [display, setDisplay] = useState(() => groupThousands(value));

  useEffect(() => {
    const currentRaw = display.replace(/,/g, '');
    if (currentRaw !== value) setDisplay(groupThousands(value));
  }, [value, display]);

  const handleChange = (input: string) => {
    let raw = input.replace(/,/g, '').replace(/[^\d.]/g, '');
    const firstDot = raw.indexOf('.');
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
    }
    const [intPart = '', decPart] = raw.split('.');
    const trimmedInt = intPart.slice(0, maxIntegerDigits);
    const trimmedDec = decPart !== undefined ? decPart.slice(0, maxDecimalDigits) : undefined;
    const normalized = trimmedDec !== undefined ? `${trimmedInt}.${trimmedDec}` : trimmedInt;
    setDisplay(groupThousands(normalized));
    onValueChange(normalized);
  };

  return (
    <Input
      id={id}
      inputMode="decimal"
      placeholder={placeholder}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      className={className}
    />
  );
}
