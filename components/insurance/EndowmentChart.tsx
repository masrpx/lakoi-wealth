"use client";

import { useMemo } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import type { EndowmentPolicy } from "@/types/insurance";
import { calculateEndowmentMetrics, calculateEndowmentTimeline, totalDeathBenefitAtAge } from "@/lib/calculations/endowment";
import { InsightCallout } from "./InsightCallout";

interface EndowmentChartProps {
  policy: EndowmentPolicy;
  currentAge: number;
}

function fmtY(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value}`;
}

function fmtBaht(n: number): string {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 min-w-0"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-2xl font-bold mt-1 truncate text-display" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-lg text-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>อายุ {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtBaht(p.value)}
        </p>
      ))}
    </div>
  );
};

export function EndowmentChart({ policy, currentAge }: EndowmentChartProps) {
  const metrics = useMemo(() => calculateEndowmentMetrics(policy), [policy]);
  const timeline = useMemo(() => calculateEndowmentTimeline(policy, currentAge), [policy, currentAge]);

  const crossoverAge = useMemo(
    () => timeline.find((r) => r.gain >= 0)?.age ?? null,
    [timeline]
  );

  const chartData = useMemo(
    () => timeline.map((r) => ({
      age: r.age,
      "เบี้ยสะสม": r.cumulativePaid,
      "มูลค่าเวนคืน": r.projectedValue ?? r.cashValue,
      "ทุนประกัน": totalDeathBenefitAtAge(policy, r.age),
    })),
    [timeline, policy]
  );

  const yAxisMax = useMemo(() => {
    const dataMax = Math.max(
      ...chartData.map((d) => d["เบี้ยสะสม"]),
      ...chartData.map((d) => d["มูลค่าเวนคืน"]),
      ...chartData.map((d) => d["ทุนประกัน"]),
      policy.projectedMaturityValue ?? 0,
    );
    return Math.ceil(dataMax * 1.18);
  }, [chartData, policy.projectedMaturityValue]);

  const irrDisplay = metrics.projectedIRR ?? metrics.irr;
  const valueDisplay = metrics.projectedMaturityValue ?? metrics.finalCashValue;

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
      {/* KPI row */}
      <div className="flex gap-3">
        <KpiCard
          label="รวมเบี้ยที่จ่าย"
          value={fmtBaht(metrics.totalPaid)}
          color="var(--rose-500)"
        />
        <KpiCard
          label="ทุนประกัน (ชีวิต)"
          value={fmtBaht(policy.sumInsured)}
          sub="คงที่ตลอดสัญญา"
          color="var(--gold-500)"
        />
        <KpiCard
          label={metrics.projectedMaturityValue ? "เงินคืน + ปันผล (ประมาณ)" : "เงินคืนครบสัญญา"}
          value={fmtBaht(valueDisplay)}
          sub={metrics.projectedMaturityValue ? `รับประกัน ${fmtBaht(metrics.finalCashValue)}` : undefined}
          color="var(--teal-500)"
        />
        <KpiCard
          label="ผลตอบแทน (IRR)"
          value={`${(irrDisplay * 100).toFixed(2)}%`}
          sub={metrics.projectedIRR ? "จากประมาณการ" : "จากรับประกัน"}
          color="var(--blue-500)"
        />
      </div>

      {/* Chart */}
      <div
        className="rounded-xl p-4"
        style={{ height: 320, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--rose-500)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--rose-500)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--teal-500)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--teal-500)" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "อายุ", position: "insideBottomRight", offset: -4, fontSize: 11, fill: "var(--text-muted)" }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              width={60}
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--text-secondary)" }}
            />
            <Area
              type="monotone"
              dataKey="เบี้ยสะสม"
              stroke="var(--rose-500)"
              strokeWidth={2}
              fill="url(#gradPremium)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="มูลค่าเวนคืน"
              stroke="var(--teal-500)"
              strokeWidth={3}
              fill="url(#gradCash)"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="ทุนประกัน"
              stroke="var(--gold-500)"
              strokeWidth={3}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={false}
            />
            {crossoverAge !== null && (
              <ReferenceLine
                x={crossoverAge}
                stroke="var(--text-muted)"
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{ value: `คุ้มทุน อายุ ${crossoverAge}`, position: "top", fontSize: 11, fill: "var(--text-muted)" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      <InsightCallout policy={policy} metrics={metrics} crossoverAge={crossoverAge} />
    </div>
  );
}
