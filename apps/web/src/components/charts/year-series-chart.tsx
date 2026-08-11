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

function buildRows(series: YearSeries[], categories: string[]): ChartRow[] {
  return categories.map((label, index) => {
    const row: ChartRow = { label };
    for (const s of series) {
      // Un año en curso trae ceros en los meses futuros: se omiten para no dibujar caidas a 0.
      const value = s.values[index] ?? 0;
      const hasLater = s.values.slice(index).some((v) => v > 0);
      if (value > 0 || hasLater) row[String(s.year)] = value;
    }
    return row;
  });
}

// Las etiquetas se dibujan por serie y categoria: pasado este total se solapan.
const MAX_LABEL_POINTS = 24;

function renderLabel(value: number | string) {
  const n = Number(value);
  if (!n) return '';
  return compactAmount(n);
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
  const axis = '#898781';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';

  const rows = buildRows(series, categories);
  const colorOf = (index: number) => categoricalColor(index, isDark);
  const labelsVisible = showLabels && series.length * categories.length <= MAX_LABEL_POINTS;

  const shared = (
    <>
      <CartesianGrid stroke={grid} vertical={false} />
      <XAxis dataKey="label" stroke={axis} tickLine={false} axisLine={false} fontSize={12} />
      <YAxis
        stroke={axis}
        tickLine={false}
        axisLine={false}
        fontSize={12}
        width={64}
        tickFormatter={(v) => compactAmount(Number(v))}
      />
      <Tooltip
        formatter={(v: number, name: string) => [formatMoney(String(v), 'PEN'), name]}
        contentStyle={{
          background: isDark ? '#1f1e1c' : '#ffffff',
          border: `1px solid ${grid}`,
          borderRadius: 12,
          fontSize: 12,
        }}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </>
  );

  if (variant === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 24, right: 16, bottom: 0, left: 8 }}>
          {shared}
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
      <BarChart data={rows} margin={{ top: 24, right: 16, bottom: 0, left: 8 }} barGap={2}>
        {shared}
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
