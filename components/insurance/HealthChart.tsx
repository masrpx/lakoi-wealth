"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HealthPolicy } from "@/types/insurance";
import {
  fillHealthPremiumGrid,
  buildHealthPremiumSchedule,
} from "@/lib/calculations/health-premium";

interface HealthChartProps {
  policy: HealthPolicy;
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

function fmtBahtShort(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}ล้าน`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function barColor(age: number): string {
  if (age < 50) return "#2dd4bf";
  if (age < 65) return "#60a5fa";
  if (age < 80) return "#c9a84c";
  return "#fb7185";
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

const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-lg text-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>อายุ {label}</p>
      <p style={{ color: barColor(label ?? 0) }}>{fmtBaht(payload[0].value)}/ปี</p>
    </div>
  );
};

const CumulativeTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-lg text-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>อายุ {label}</p>
      <p style={{ color: "var(--teal-500)" }}>สะสม {fmtBaht(payload[0].value)}</p>
    </div>
  );
};

export function HealthChart({ policy }: HealthChartProps) {
  const filledGrid = useMemo(
    () => fillHealthPremiumGrid(policy.yearlyPremiumByAge, policy.startAge, policy.endAge),
    [policy]
  );

  const schedule = useMemo(
    () => buildHealthPremiumSchedule({ ...policy, yearlyPremiumByAge: filledGrid }),
    [policy, filledGrid]
  );

  const totalPremium = schedule.length > 0 ? schedule[schedule.length - 1].cumulativePaid : 0;
  const years = policy.endAge - policy.startAge + 1;
  const avgYearly = years > 0 ? Math.round(totalPremium / years) : 0;
  const peakRow = schedule.reduce(
    (best, r) => (r.premium > best.premium ? r : best),
    { age: policy.startAge, premium: 0, cumulativePaid: 0 }
  );

  const xAxisTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let a = policy.startAge; a <= policy.endAge; a++) {
      if (a % 5 === 0) ticks.push(a);
    }
    return ticks;
  }, [policy.startAge, policy.endAge]);

  const isEmpty = schedule.every((r) => r.premium === 0);

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">

      {/* KPI row */}
      <div className="flex gap-3">
        <KpiCard
          label="เบี้ยรวมตลอดชีวิต"
          value={fmtBahtShort(totalPremium)}
          sub={`อายุ ${policy.startAge}–${policy.endAge} ปี`}
          color="var(--rose-500)"
        />
        <KpiCard
          label="เบี้ยเฉลี่ยต่อปี"
          value={fmtBahtShort(avgYearly)}
          color="var(--blue-500)"
        />
        <KpiCard
          label="เบี้ยสูงสุด (ต่อปี)"
          value={fmtBahtShort(peakRow.premium)}
          sub={peakRow.premium > 0 ? `อายุ ${peakRow.age} ปี` : undefined}
          color="var(--gold-500)"
        />
      </div>

      {isEmpty ? (
        <div
          className="flex-1 rounded-xl flex flex-col items-center justify-center gap-2"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลเบี้ย</p>
          <p className="text-xs text-muted-foreground">กรอกเบี้ยในตารางทางซ้ายเพื่อเริ่มต้น</p>
        </div>
      ) : (
        <>
          {/* Bar chart — yearly premium */}
          <div
            className="rounded-xl p-4"
            style={{ height: 260, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              เบี้ยรายปี ตามอายุ
            </p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={schedule} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="age"
                  ticks={xAxisTicks}
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={fmtY}
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="premium" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {schedule.map((row) => (
                    <Cell key={row.age} fill={barColor(row.age)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative area chart */}
          <div
            className="rounded-xl p-4"
            style={{ height: 160, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              เบี้ยสะสม
            </p>
            <ResponsiveContainer width="100%" height="75%">
              <AreaChart data={schedule} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--teal-500)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--teal-500)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="age"
                  ticks={xAxisTicks}
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={fmtY}
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<CumulativeTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulativePaid"
                  stroke="var(--teal-500)"
                  strokeWidth={2}
                  fill="url(#gradCumulative)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          <div
            className="rounded-xl p-4"
            style={{
              border: "1.5px solid var(--gold-500)",
              background: "rgba(201,168,76,0.06)",
              boxShadow: "var(--shadow-glow-gold)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--gold-700)" }}>
              สรุปกรมธรรม์สุขภาพ
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              ค่าเบี้ยรวมตลอดอายุ {fmtBahtShort(totalPremium)} ตั้งแต่อายุ {policy.startAge}–{policy.endAge} ปี
            </p>
            {peakRow.premium > 0 && (
              <p className="text-sm leading-relaxed font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                ช่วงภาระสูงสุด: อายุ {peakRow.age}+ ปี เบี้ย {fmtBahtShort(peakRow.premium)}/ปี
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
