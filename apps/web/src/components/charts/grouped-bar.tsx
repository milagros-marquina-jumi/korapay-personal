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
  layout?: 'horizontal' | 'vertical';
}

const MAX_LABEL_POINTS = 24;

function renderLabel(value: number | string) {
  const n = Number(value);
  return n ? compactAmount(n) : '';
}

export function GroupedBar({ data, series, height = 320, showLabels = true, layout = 'horizontal' }: Readonly<Props>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = isDark ? '#a3a19a' : '#6b6960';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';
  const isVertical = layout === 'vertical';
  const labelsVisible = showLabels && data.length * series.length <= MAX_LABEL_POINTS;
  const tick = { fill: axis, fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: labelsVisible && !isVertical ? 26 : 12, right: isVertical ? 56 : 16, bottom: 4, left: 8 }}
        barGap={4}
      >
        <CartesianGrid stroke={grid} vertical={isVertical} horizontal={!isVertical} />
        {isVertical ? (
          <XAxis
            type="number"
            stroke={axis}
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: grid }}
            tickFormatter={compactAmount}
          />
        ) : (
          <XAxis dataKey="label" stroke={axis} tick={tick} tickLine={false} axisLine={{ stroke: grid }} />
        )}
        {isVertical ? (
          <YAxis
            type="category"
            dataKey="label"
            stroke={axis}
            tick={tick}
            tickLine={false}
            axisLine={false}
            width={130}
          />
        ) : (
          <YAxis stroke={axis} tick={tick} tickLine={false} axisLine={false} width={68} tickFormatter={compactAmount} />
        )}
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
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {(labelsVisible || isVertical) && (
              <LabelList
                dataKey={s.key}
                position={isVertical ? 'right' : 'top'}
                fontSize={10}
                fill={s.color}
                formatter={renderLabel}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
