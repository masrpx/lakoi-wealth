"use client";

import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import type { CashflowMonthPointV2, CashflowYearPointV2 } from "@/lib/calculations/cashflow";

function fmtY(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}฿${(abs / 1_000).toFixed(0)}K`;
  return `฿0`;
}

function fmtBaht(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}ล้าน`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${Math.round(abs).toLocaleString("th-TH")}`;
}

const LABELS: Record<string, string> = {
  income: "รายรับ",
  livingExpense: "ค่าครองชีพ",
  insurancePremium: "เบี้ยประกัน",
  investmentDCA: "ลงทุน DCA",
  debtPayment: "ชำระหนี้",
  customExpenseTotal: "อื่น ๆ",
  net: "สุทธิ",
};

function CFTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const nonZero = payload.filter((p) => Math.abs(p.value ?? 0) > 0);
  return (
    <div className="rounded-lg p-3 text-xs shadow-lg space-y-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>{label}</p>
      {nonZero.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {LABELS[p.dataKey] ?? p.name}: {fmtBaht(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Monthly: single-month comparison visual ───────────────────────────────────

function MonthlyComparison({ point }: { point: CashflowMonthPointV2 }) {
  const totalExpenses =
    point.livingExpense +
    point.insurancePremium +
    point.investmentDCA +
    point.debtPayment +
    point.customExpenseTotal;

  const segments = [
    { label: "ค่าครองชีพ", value: point.livingExpense, color: "#fb7185" },
    { label: "เบี้ยประกัน", value: point.insurancePremium, color: "#a78bfa" },
    { label: "ลงทุน DCA", value: point.investmentDCA, color: "#60a5fa" },
    { label: "ชำระหนี้", value: point.debtPayment, color: "#f59e0b" },
    { label: "อื่น ๆ", value: point.customExpenseTotal, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const max = Math.max(point.income, totalExpenses) || 1;

  return (
    <div className="px-4 pt-3 pb-4">
      <div className="space-y-2">
        {/* Income bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <span>รายรับ</span>
            <span style={{ color: "#2dd4bf" }} className="font-semibold">{fmtBaht(point.income)}</span>
          </div>
          <div className="h-5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(point.income / max) * 100}%`, background: "#2dd4bf" }}
            />
          </div>
        </div>

        {/* Expense stacked bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <span>รายจ่ายรวม</span>
            <span style={{ color: "#fb7185" }} className="font-semibold">{fmtBaht(totalExpenses)}</span>
          </div>
          <div className="h-5 rounded-full overflow-hidden flex" style={{ background: "var(--bg-elevated)" }}>
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="h-full transition-all"
                style={{ width: `${(seg.value / max) * 100}%`, background: seg.color }}
                title={`${seg.label}: ${fmtBaht(seg.value)}`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {segments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
              {seg.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Yearly: 30-bar composed chart ─────────────────────────────────────────────

interface CashflowChartProps {
  monthlyPoint: CashflowMonthPointV2;
  yearlyData: CashflowYearPointV2[];
  view: "monthly" | "yearly";
}

export function CashflowChart({ monthlyPoint, yearlyData, view }: CashflowChartProps) {
  if (view === "monthly") {
    return <MonthlyComparison point={monthlyPoint} />;
  }

  const xTicks = yearlyData.filter((_, i) => i % 5 === 0).map((p) => p.age);

  return (
    <div className="px-4 pt-3 pb-2">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={yearlyData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="age"
            ticks={xTicks}
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
          <Tooltip content={<CFTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "var(--text-muted)" }}
            formatter={(v: string) => LABELS[v] ?? v}
          />
          <Bar dataKey="income"             stackId="income"  fill="#2dd4bf" isAnimationActive={false} />
          <Bar dataKey="livingExpense"      stackId="expense" fill="#fb7185" isAnimationActive={false} />
          <Bar dataKey="insurancePremium"   stackId="expense" fill="#a78bfa" isAnimationActive={false} />
          <Bar dataKey="investmentDCA"      stackId="expense" fill="#60a5fa" isAnimationActive={false} />
          <Bar dataKey="debtPayment"        stackId="expense" fill="#f59e0b" isAnimationActive={false} />
          <Bar dataKey="customExpenseTotal" stackId="expense" fill="#94a3b8" isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--gold-500)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
