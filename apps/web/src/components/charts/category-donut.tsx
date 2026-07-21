'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { categoricalColor } from './palette';

export interface CategorySlice {
  name: string;
  value: number;
}

interface Props {
  data: CategorySlice[];
  height?: number;
}

export function CategoryDonut({ data, height = 300 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          strokeWidth={2}
          stroke={isDark ? '#1a1a19' : '#ffffff'}
        >
          {data.map((slice, i) => (
            <Cell key={slice.name} fill={categoricalColor(i, isDark)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(120,120,120,0.2)',
            background: isDark ? '#1a1a19' : '#ffffff',
            color: isDark ? '#ffffff' : '#0b0b0b',
            fontSize: 12,
          }}
          formatter={(value: number, name) => [
            `${formatMoney(String(value), 'PEN')} (${total ? ((value / total) * 100).toFixed(1) : '0'}%)`,
            name,
          ]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
