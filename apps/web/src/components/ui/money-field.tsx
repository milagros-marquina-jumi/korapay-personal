'use client';

import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { MoneyInput } from '@/components/ui/money-input';

interface MoneyFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  id?: string;
  placeholder?: string;
  maxIntegerDigits?: number;
  maxDecimalDigits?: number;
  className?: string;
}

/**
 * Puente entre react-hook-form y MoneyInput: el form guarda el valor crudo
 * ("1419.00") y el usuario ve el agrupado ("1,419.00").
 */
export function MoneyField<T extends FieldValues>({
  control,
  name,
  id,
  placeholder = '0.00',
  maxIntegerDigits,
  maxDecimalDigits = 2,
  className,
}: Readonly<MoneyFieldProps<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MoneyInput
          id={id}
          value={field.value ?? ''}
          onValueChange={field.onChange}
          placeholder={placeholder}
          maxIntegerDigits={maxIntegerDigits}
          maxDecimalDigits={maxDecimalDigits}
          className={className}
        />
      )}
    />
  );
}
