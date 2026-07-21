'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EXPENSE_COLOR, INCOME_COLOR } from './palette';

export interface IncomeExpensePoint {
  label: string;
  ingresos: number;
  egresos: number;
}

interface Props {
  data: IncomeExpensePoint[];
  height?: number;
}

export function IncomeExpenseArea({ data, height = 300 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = isDark ? '#898781' : '#898781';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillEgresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="0" vertical={false} />
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
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            background: isDark ? '#1e293b' : '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: 12,
            padding: '8px 12px',
          }}
          itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
          formatter={(value: number, name) => [formatMoney(String(value), 'PEN'), name]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="ingresos"
          name="Ingresos"
          stroke={INCOME_COLOR}
          strokeWidth={2}
          fill="url(#fillIngresos)"
        />
        <Area
          type="monotone"
          dataKey="egresos"
          name="Egresos"
          stroke={EXPENSE_COLOR}
          strokeWidth={2}
          fill="url(#fillEgresos)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
