'use client';

import { Input } from '@/components/ui/input';

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export function MonthInput({ id, value, onChange }: Readonly<Props>) {
  return (
    <Input
      id={id}
      type="month"
      value={(value ?? '').slice(0, 7)}
      onChange={(e) => onChange(e.target.value ? `${e.target.value}-01` : '')}
    />
  );
}
