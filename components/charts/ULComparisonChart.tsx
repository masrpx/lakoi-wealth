"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { YearlyPolicyValue } from "@/types/insurance";
import { calculateULPeakValue } from "@/lib/calculations/unit-link";

export interface ComparisonLine {
  name: string;
  color: string;
  data: YearlyPolicyValue[];
}

interface ULComparisonChartProps {
  lines: ComparisonLine[];
  startAge: number;
}

function fmtY(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value}`;
}

function fmtBaht(n: number): string {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

export function fmtBahtShort(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

type TooltipEntry = { name: string; value: number; color: string; dataKey: string };

const ComparisonTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 text-sm shadow-lg"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>อายุ {label} ปี</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtBaht(p.value)}
        </p>
      ))}
    </div>
  );
};

export function ULComparisonChart({ lines, startAge }: ULComparisonChartProps) {
  // Merge all lines into one dataset indexed by age
  const chartData = useMemo(() => {
    const maxLen = Math.max(...lines.map((l) => l.data.length), 1);
    return Array.from({ length: maxLen }, (_, i) => {
      const age = startAge + i;
      const row: Record<string, number | null | string> = { age };
      lines.forEach((l) => {
        row[l.name] = i < l.data.length ? l.data[i].endValue : null;
      });
      return row;
    });
  }, [lines, startAge]);

  const yMax = useMemo(
    () => Math.max(...lines.flatMap((l) => l.data.map((d) => d.endValue)), 0) * 1.12,
    [lines]
  );

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let age = startAge; age <= startAge + 60; age++) {
      if (age % 5 === 0) ticks.push(age);
    }
    return ticks;
  }, [startAge]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="age"
          ticks={xTicks}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={fmtY}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={56}
          domain={[0, yMax]}
        />
        <Tooltip content={<ComparisonTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--text-secondary)" }} />
        {lines.map((l) => (
          <Line
            key={l.name}
            type="monotone"
            dataKey={l.name}
            stroke={l.color}
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Metrics derived from a comparison line
export function getLineMetrics(line: ComparisonLine) {
  const { peakValue, peakAge } = calculateULPeakValue(line.data);
  const lapseRow = line.data.find((r) => r.endValue === 0 && r.year > 1);
  const lastRow = line.data[line.data.length - 1];
  return {
    peakValue,
    peakAge,
    lapseAge: lapseRow?.age ?? null,
    finalValue: lastRow?.endValue ?? 0,
    finalAge: lastRow?.age ?? 0,
  };
}
