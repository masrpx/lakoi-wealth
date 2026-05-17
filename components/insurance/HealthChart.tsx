"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HealthPolicy } from "@/types/insurance";

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
  if (age < 51) return "#2dd4bf";   // bands 1–50
  if (age < 66) return "#60a5fa";   // bands 51–65
  if (age < 81) return "#c9a84c";   // bands 66–80
  return "#fb7185";                 // bands 81+
}

/** Step-function schedule: each age uses the most recent checkpoint value, no interpolation. */
function buildStepSchedule(
  sparseInputs: Record<number, number>,
  startAge: number,
  endAge: number
): { age: number; premium: number; cumulativePaid: number }[] {
  const entries = Object.entries(sparseInputs)
    .map(([k, v]) => ({ age: Number(k), value: v }))
    .filter((e) => e.age >= startAge && e.age <= endAge)
    .sort((a, b) => a.age - b.age);

  const rows: { age: number; premium: number; cumulativePaid: number }[] = [];
  let cumulative = 0;
  for (let age = startAge; age <= endAge; age++) {
    const prev = [...entries].reverse().find((e) => e.age <= age);
    const premium = prev?.value ?? 0;
    cumulative += premium;
    rows.push({ age, premium, cumulativePaid: cumulative });
  }
  return rows;
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
  const stepSchedule = useMemo(
    () => buildStepSchedule(policy.yearlyPremiumByAge, policy.startAge, policy.endAge),
    [policy]
  );

  // Range sum state — numeric values
  const [rangeFrom, setRangeFrom] = useState(policy.startAge);
  const [rangeTo,   setRangeTo]   = useState(policy.endAge);
  // Local text state so the user can type freely without clamping on each keystroke
  const [fromText, setFromText] = useState(String(policy.startAge));
  const [toText,   setToText]   = useState(String(policy.endAge));

  useEffect(() => {
    setRangeFrom(policy.startAge);
    setRangeTo(policy.endAge);
    setFromText(String(policy.startAge));
    setToText(String(policy.endAge));
  }, [policy.startAge, policy.endAge]);

  const rangeTotal = useMemo(
    () => stepSchedule
      .filter((r) => r.age >= rangeFrom && r.age <= rangeTo)
      .reduce((sum, r) => sum + r.premium, 0),
    [stepSchedule, rangeFrom, rangeTo]
  );

  // Per-year bars with inRange flag
  const barData = useMemo(
    () => stepSchedule.map((r) => ({ ...r, inRange: r.age >= rangeFrom && r.age <= rangeTo })),
    [stepSchedule, rangeFrom, rangeTo]
  );

  const totalPremium = stepSchedule.length > 0 ? stepSchedule[stepSchedule.length - 1].cumulativePaid : 0;
  const years = policy.endAge - policy.startAge + 1;
  const avgYearly = years > 0 ? Math.round(totalPremium / years) : 0;
  const peakRow = stepSchedule.reduce(
    (best, r) => (r.premium > best.premium ? r : best),
    { age: policy.startAge, premium: 0, cumulativePaid: 0 }
  );

  const xAxisTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let a = policy.startAge; a <= policy.endAge; a++) {
      if ((a - 1) % 5 === 0) ticks.push(a);
    }
    return ticks;
  }, [policy.startAge, policy.endAge]);

  const isEmpty = stepSchedule.every((r) => r.premium === 0);

  const isFullRange = rangeFrom === policy.startAge && rangeTo === policy.endAge;

  const commitFrom = (raw: string) => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? policy.startAge : Math.max(policy.startAge, Math.min(n, rangeTo - 1));
    setRangeFrom(clamped);
    setFromText(String(clamped));
  };

  const commitTo = (raw: string) => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? policy.endAge : Math.min(policy.endAge, Math.max(n, rangeFrom + 1));
    setRangeTo(clamped);
    setToText(String(clamped));
  };

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

      {/* Range sum selector */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "var(--text-muted)" }}>
          ช่วงอายุ
        </span>

        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={fromText}
            onChange={(e) => setFromText(e.target.value)}
            onBlur={(e) => commitFrom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitFrom(fromText)}
            className="w-16 text-sm font-bold text-center rounded-lg px-2 outline-none"
            style={{
              height: 36,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <span className="text-xs text-muted-foreground">ถึง</span>
          <input
            type="text"
            inputMode="numeric"
            value={toText}
            onChange={(e) => setToText(e.target.value)}
            onBlur={(e) => commitTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitTo(toText)}
            className="w-16 text-sm font-bold text-center rounded-lg px-2 outline-none"
            style={{
              height: 36,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">{rangeTo - rangeFrom + 1} ปี</p>
          <p className="text-base font-bold" style={{ color: "var(--gold-500)" }}>
            {fmtBaht(rangeTotal)}
          </p>
        </div>
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
          {/* Bar chart — per-year step values */}
          <div
            className="rounded-xl p-4"
            style={{ height: 260, background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              เบี้ยรายปี ตามอายุ
            </p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="5%">
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
                <Bar dataKey="premium" radius={[1, 1, 0, 0]} isAnimationActive={false}>
                  {barData.map((row) => (
                    <Cell
                      key={row.age}
                      fill={barColor(row.age)}
                      fillOpacity={isFullRange || row.inRange ? 0.85 : 0.18}
                    />
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
              <AreaChart data={stepSchedule} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
