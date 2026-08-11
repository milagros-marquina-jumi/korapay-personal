'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactAmount, EXPENSE_COLOR, INCOME_COLOR } from './palette';

export interface MonthlyPoint {
  label: string;
  ingresos: number;
  egresos: number;
}

interface Props {
  data: MonthlyPoint[];
  height?: number;
  firstName?: string;
  firstColor?: string;
  secondName?: string;
  secondColor?: string;
  showLabels?: boolean;
}

const MAX_LABELED_CATEGORIES = 14;

function barLabel(value: number | string) {
  const n = Number(value);
  return n ? compactAmount(n) : '';
}

export function MonthlyBar({
  data,
  height = 300,
  firstName = 'Ingresos',
  firstColor = INCOME_COLOR,
  secondName = 'Egresos',
  secondColor = EXPENSE_COLOR,
  showLabels = true,
}: Readonly<Props>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = '#898781';
  const labelsVisible = showLabels && data.length <= MAX_LABELED_CATEGORIES;
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: labelsVisible ? 22 : 8, right: 12, bottom: 0, left: 8 }} barGap={2}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={8}
        />
        <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} width={56} tickFormatter={compactAmount} />
        <Tooltip
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
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
        <Bar dataKey="ingresos" name={firstName} fill={firstColor} radius={[4, 4, 0, 0]}>
          {labelsVisible && (
            <LabelList dataKey="ingresos" position="top" fontSize={10} fill={axis} formatter={barLabel} />
          )}
        </Bar>
        <Bar dataKey="egresos" name={secondName} fill={secondColor} radius={[4, 4, 0, 0]}>
          {labelsVisible && (
            <LabelList dataKey="egresos" position="top" fontSize={10} fill={axis} formatter={barLabel} />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
