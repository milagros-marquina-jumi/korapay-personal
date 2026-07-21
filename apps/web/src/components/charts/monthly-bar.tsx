'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EXPENSE_COLOR, INCOME_COLOR } from './palette';

export interface MonthlyPoint {
  label: string;
  ingresos: number;
  egresos: number;
}

interface Props {
  data: MonthlyPoint[];
  height?: number;
}

export function MonthlyBar({ data, height = 300 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = '#898781';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barGap={2}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke={axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={(v) => formatMoney(String(v), 'PEN')}
        />
        <Tooltip
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(120,120,120,0.2)',
            background: isDark ? '#1a1a19' : '#ffffff',
            color: isDark ? '#ffffff' : '#0b0b0b',
            fontSize: 12,
          }}
          formatter={(value: number, name) => [formatMoney(String(value), 'PEN'), name]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ingresos" name="Ingresos" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="egresos" name="Egresos" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
