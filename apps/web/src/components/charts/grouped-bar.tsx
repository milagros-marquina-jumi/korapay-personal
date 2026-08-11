'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactAmount } from './palette';

export interface GroupedBarSeries {
  key: string;
  name: string;
  color: string;
}

export interface GroupedBarRow {
  label: string;
  [key: string]: string | number;
}

interface Props {
  data: GroupedBarRow[];
  series: GroupedBarSeries[];
  height?: number;
  showLabels?: boolean;
}

const MAX_LABEL_POINTS = 24;

function renderLabel(value: number | string) {
  const n = Number(value);
  return n ? compactAmount(n) : '';
}

export function GroupedBar({ data, series, height = 320, showLabels = true }: Readonly<Props>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = isDark ? '#a3a19a' : '#6b6960';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';
  const labelsVisible = showLabels && data.length * series.length <= MAX_LABEL_POINTS;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: labelsVisible ? 26 : 12, right: 16, bottom: 4, left: 8 }} barGap={4}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={axis}
          tick={{ fill: axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: grid }}
        />
        <YAxis
          stroke={axis}
          tick={{ fill: axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={68}
          tickFormatter={compactAmount}
        />
        <Tooltip
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
          formatter={(v: number, name: string) => [formatMoney(String(v), 'PEN'), name]}
          contentStyle={{
            background: isDark ? '#1f1e1c' : '#ffffff',
            border: `1px solid ${grid}`,
            borderRadius: 12,
            fontSize: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
          itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]}>
            {labelsVisible && (
              <LabelList dataKey={s.key} position="top" fontSize={10} fill={s.color} formatter={renderLabel} />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
