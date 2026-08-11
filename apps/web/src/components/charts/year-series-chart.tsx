'use client';

import { formatMoney } from '@korapay/domain';
import { useTheme } from 'next-themes';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { categoricalColor, compactAmount } from './palette';

export interface YearSeries {
  year: number;
  values: number[];
}

interface Props {
  series: YearSeries[];
  categories: string[];
  variant?: 'bar' | 'line';
  height?: number;
  showLabels?: boolean;
}

interface ChartRow {
  label: string;
  [year: string]: string | number;
}

const MAX_LABEL_POINTS = 24;

function buildRows(series: YearSeries[], categories: string[]): ChartRow[] {
  return categories.map((label, index) => {
    const row: ChartRow = { label };
    for (const s of series) {
      const value = s.values[index] ?? 0;
      const hasLater = s.values.slice(index).some((v) => v > 0);
      if (value > 0 || hasLater) row[String(s.year)] = value;
    }
    return row;
  });
}

function renderLabel(value: number | string) {
  const n = Number(value);
  return n ? compactAmount(n) : '';
}

export function YearSeriesChart({
  series,
  categories,
  variant = 'bar',
  height = 340,
  showLabels = true,
}: Readonly<Props>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axis = isDark ? '#a3a19a' : '#6b6960';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';

  const rows = buildRows(series, categories);
  const colorOf = (index: number) => categoricalColor(index, isDark);
  const labelsVisible = showLabels && series.length * categories.length <= MAX_LABEL_POINTS;

  const axisProps = { stroke: axis, tick: { fill: axis, fontSize: 12 } };
  const tooltipProps = {
    formatter: (v: number, name: string) => [formatMoney(String(v), 'PEN'), name] as [string, string],
    contentStyle: {
      background: isDark ? '#1f1e1c' : '#ffffff',
      border: `1px solid ${grid}`,
      borderRadius: 12,
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    },
    itemStyle: { color: isDark ? '#f1f5f9' : '#0f172a' },
    labelStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 600 },
  };
  const legendProps = { iconType: 'circle' as const, wrapperStyle: { fontSize: 12, paddingTop: 8 } };
  const margin = { top: labelsVisible ? 26 : 12, right: 16, bottom: 4, left: 8 };

  if (variant === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={margin}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} tickLine={false} axisLine={{ stroke: grid }} />
          <YAxis {...axisProps} tickLine={false} axisLine={false} width={68} tickFormatter={compactAmount} />
          <Tooltip {...tooltipProps} />
          <Legend {...legendProps} />
          {series.map((s, i) => (
            <Line
              key={s.year}
              type="monotone"
              dataKey={String(s.year)}
              name={String(s.year)}
              stroke={colorOf(i)}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            >
              {labelsVisible && (
                <LabelList
                  dataKey={String(s.year)}
                  position="top"
                  fontSize={10}
                  fill={colorOf(i)}
                  formatter={renderLabel}
                />
              )}
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={margin} barGap={2}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis {...axisProps} tickLine={false} axisLine={false} width={68} tickFormatter={compactAmount} />
        <Tooltip {...tooltipProps} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
        <Legend {...legendProps} />
        {series.map((s, i) => (
          <Bar key={s.year} dataKey={String(s.year)} name={String(s.year)} fill={colorOf(i)} radius={[4, 4, 0, 0]}>
            {labelsVisible && (
              <LabelList
                dataKey={String(s.year)}
                position="top"
                fontSize={10}
                fill={colorOf(i)}
                formatter={renderLabel}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
