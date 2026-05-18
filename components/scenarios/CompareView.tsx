"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Scenario } from "@/types";
import type { ScenarioMetrics } from "@/lib/calculations/scenarios";
import { buildNetWorthSeries } from "@/lib/calculations/scenarios";

const COLORS = ["#c9a84c", "#2dd4bf", "#60a5fa"];

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

interface CompareItem {
  scenario: Scenario;
  metrics: ScenarioMetrics;
}

interface Props {
  items: CompareItem[];
}

interface ChartRow {
  age: number;
  [key: string]: number;
}

export function CompareView({ items }: Props) {
  const chartData = useMemo<ChartRow[]>(() => {
    const seriesAll = items.map((item) => buildNetWorthSeries(item.scenario.state, 35));
    const maxLen = Math.max(...seriesAll.map((s) => s.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const row: ChartRow = { age: seriesAll[0]?.[i]?.age ?? 0 };
      items.forEach((item, idx) => {
        row[item.scenario.id] = seriesAll[idx]?.[i]?.netWorth ?? 0;
      });
      return row;
    });
  }, [items]);

  const metricRows = [
    {
      label: "มูลค่าสุทธิที่เกษียณ",
      getValue: (m: ScenarioMetrics) => fmtBaht(m.netWorthAtRetirement),
      color: "var(--gold-500)",
    },
    {
      label: "เบี้ยประกันรวม/ปี",
      getValue: (m: ScenarioMetrics) => fmtBaht(m.totalYearlyPremium),
      color: "var(--rose-500)",
    },
    {
      label: "Gap เกษียณ/เดือน",
      getValue: (m: ScenarioMetrics) => {
        const v = m.retirementGapMonthly;
        return `${v >= 0 ? "+" : ""}${fmtBaht(v)}`;
      },
      getColor: (m: ScenarioMetrics) =>
        m.retirementGapMonthly >= 0 ? "var(--teal-500)" : "var(--rose-500)",
    },
    {
      label: "มูลค่าสุทธิปัจจุบัน",
      getValue: (m: ScenarioMetrics) => fmtBaht(m.currentNetWorth),
      color: "var(--text-primary)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Side-by-side metric columns */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        {/* Header row */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `180px repeat(${items.length}, 1fr)`,
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            ตัวชี้วัด
          </div>
          {items.map((item, idx) => (
            <div key={item.scenario.id} className="px-4 py-3">
              <div
                className="w-2 h-2 rounded-full inline-block mr-2"
                style={{ background: COLORS[idx] }}
              />
              <span className="text-xs font-semibold">{item.scenario.name}</span>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {metricRows.map((row, ri) => (
          <div
            key={ri}
            className="grid"
            style={{
              gridTemplateColumns: `180px repeat(${items.length}, 1fr)`,
              borderBottom: ri < metricRows.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            <div className="px-4 py-4 text-xs text-muted-foreground flex items-center">
              {row.label}
            </div>
            {items.map((item) => (
              <div key={item.scenario.id} className="px-4 py-4 flex items-center">
                <span
                  className="text-base font-bold font-display"
                  style={{ color: row.getColor ? row.getColor(item.metrics) : row.color }}
                >
                  {row.getValue(item.metrics)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Net worth projection chart */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold mb-4">การฉายภาพมูลค่าสุทธิ</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}`}
              label={{ value: "อายุ", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `฿${(v / 1_000_000).toFixed(0)}M`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v, name) => {
                const id = String(name ?? "");
                const label = items.find((it) => it.scenario.id === id)?.scenario.name ?? id;
                return [fmtBaht(typeof v === "number" ? v : 0), label];
              }}
              labelFormatter={(l) => `อายุ ${l}`}
            />
            <Legend
              formatter={(value) =>
                items.find((it) => it.scenario.id === value)?.scenario.name ?? value
              }
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            {items.map((item, idx) => (
              <Line
                key={item.scenario.id}
                type="monotone"
                dataKey={item.scenario.id}
                stroke={COLORS[idx]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
