"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import type { UnitLinkPolicy } from "@/types/insurance";
import {
  calculateUnitLinkProjection,
  calculateULPeakValue,
} from "@/lib/calculations/unit-link";

interface UnitLinkLifetimeChartProps {
  policy: UnitLinkPolicy;
  targetAge: number; // 0 = use startAge + 59 default
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
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function KpiCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div
      className="flex-1 rounded-xl p-4 min-w-0"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-2xl font-bold mt-1 truncate text-display" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function InsightCard({
  children, borderColor,
}: {
  children: React.ReactNode; borderColor: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 shrink-0"
      style={{
        border: `1.5px solid ${borderColor}`,
        background: `${borderColor}10`,
        minWidth: 220,
        maxWidth: 300,
      }}
    >
      {children}
    </div>
  );
}

type TooltipPayloadEntry = {
  dataKey: string;
  value: number;
  color: string;
  name: string;
};

const ULTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  const byKey: Record<string, number> = Object.fromEntries(
    payload.map((p) => [p.dataKey, p.value])
  );
  return (
    <div
      className="rounded-lg p-3 text-sm shadow-lg"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        อายุ {label} ปี
      </p>
      <p style={{ color: "#fb7185" }}>
        เบี้ย + ท็อปอัพสะสม: {fmtBaht(byKey["cumulativePaid"] ?? 0)}
      </p>
      <p style={{ color: "#2dd4bf" }}>
        มูลค่ากรมธรรม์: {fmtBaht(byKey["endValue"] ?? 0)}
      </p>
      <p style={{ color: "#c9a84c" }}>
        ทุนชีวิต: {fmtBaht(byKey["sumInsured"] ?? 0)}
      </p>
    </div>
  );
};

export function UnitLinkLifetimeChart({ policy, targetAge }: UnitLinkLifetimeChartProps) {
  const [showWithdrawal, setShowWithdrawal] = useState(true);

  const projectionYears = useMemo(() => {
    if (targetAge > policy.startAge) return targetAge - policy.startAge + 1;
    return 60;
  }, [targetAge, policy.startAge]);

  // With and without withdrawal projections
  const projectionWith = useMemo(
    () => calculateUnitLinkProjection(policy, policy.startAge, projectionYears),
    [policy, projectionYears]
  );

  const projectionWithout = useMemo(
    () => calculateUnitLinkProjection(
      { ...policy, withdrawals: null },
      policy.startAge,
      projectionYears
    ),
    [policy, projectionYears]
  );

  const projection = showWithdrawal ? projectionWith : projectionWithout;

  const chartData = useMemo(() => {
    let cumulativePaid = 0;
    return projection.map((r) => {
      cumulativePaid += r.premiumPaid + r.topUpPaid;
      return {
        age: r.age,
        cumulativePaid,
        endValue: r.endValue,
        sumInsured: policy.sumInsured,
      };
    });
  }, [projection, policy.sumInsured]);

  const totalPremiumPaid = projection.reduce((s, r) => s + r.premiumPaid, 0);
  const totalTopUpPaid = projection.reduce((s, r) => s + r.topUpPaid, 0);
  const totalWithdrawn = projection.reduce((s, r) => s + r.withdrawal, 0);
  const { peakValue, peakAge } = useMemo(
    () => calculateULPeakValue(projection),
    [projection]
  );

  const lapsesAt = projection.find((r) => r.endValue === 0 && r.year > 1);
  const lastRow = projection[projection.length - 1];

  const yAxisMax = useMemo(() => {
    const dataMax = Math.max(
      ...chartData.map((d) => d.cumulativePaid),
      ...chartData.map((d) => d.endValue),
      policy.sumInsured
    );
    return Math.ceil(dataMax * 1.15);
  }, [chartData, policy.sumInsured]);

  const paymentEndsAge = policy.startAge + policy.paymentPeriodYears - 1;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* KPI row */}
      <div className="flex gap-3">
        <KpiCard
          label="เบี้ยรวม"
          value={fmtBahtShort(totalPremiumPaid)}
          color="#fb7185"
        />
        <KpiCard
          label="ท็อปอัพรวม"
          value={fmtBahtShort(totalTopUpPaid)}
          color="var(--gold-500)"
        />
        <KpiCard
          label="มูลค่าพีค"
          value={fmtBahtShort(peakValue)}
          sub={`อายุ ${peakAge} ปี`}
          color="#2dd4bf"
        />
        <KpiCard
          label="ถอนรวม"
          value={fmtBahtShort(totalWithdrawn)}
          color="#9f1239"
        />
      </div>

      {/* Chart */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Withdrawal toggle */}
        {policy.withdrawals && (
          <div className="flex items-center gap-2 mb-3">
            <Switch
              checked={showWithdrawal}
              onCheckedChange={setShowWithdrawal}
              id="ul-withdrawal-toggle"
            />
            <label
              htmlFor="ul-withdrawal-toggle"
              className="text-xs cursor-pointer select-none"
              style={{ color: showWithdrawal ? "#2dd4bf" : "var(--text-muted)" }}
            >
              แสดงผลการถอนเงิน
            </label>
          </div>
        )}

        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gradULPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#fb7185" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "อายุ",
                position: "insideBottomRight",
                offset: -4,
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              width={60}
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<ULTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--text-secondary)" }} />

            {/* Rose area: cumulative premiums + top-ups paid */}
            <Area
              type="monotone"
              dataKey="cumulativePaid"
              name="เบี้ย + ท็อปอัพสะสม"
              stroke="#fb7185"
              strokeWidth={2}
              fill="url(#gradULPremium)"
              isAnimationActive={false}
            />

            {/* Teal line: policy value — the hero */}
            <Line
              type="monotone"
              dataKey="endValue"
              name="มูลค่ากรมธรรม์"
              stroke="#2dd4bf"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />

            {/* Gold dashed flat line: death coverage */}
            <Line
              type="stepAfter"
              dataKey="sumInsured"
              name="ทุนชีวิต"
              stroke="#c9a84c"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={false}
            />

            {/* Reference line: payment period ends */}
            <ReferenceLine
              x={paymentEndsAge}
              stroke="var(--gold-500)"
              strokeDasharray="3 3"
              label={{
                value: "จ่ายเบี้ยจบ",
                position: "insideTopRight",
                fontSize: 10,
                fill: "var(--gold-500)",
              }}
            />

            {/* Reference line: withdrawal starts */}
            {policy.withdrawals && showWithdrawal && (
              <ReferenceLine
                x={policy.withdrawals.startAge}
                stroke="#2dd4bf"
                strokeDasharray="3 3"
                label={{
                  value: "เริ่มถอน",
                  position: "insideTopLeft",
                  fontSize: 10,
                  fill: "#2dd4bf",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights row */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* Always: sum insured coverage */}
        <InsightCard borderColor="#c9a84c">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#c9a84c" }}>
            ทุนประกัน
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ทุนชีวิต {fmtBahtShort(policy.sumInsured)} คุ้มครองตลอดสัญญา
          </p>
        </InsightCard>

        {/* Withdrawal info */}
        {policy.withdrawals && showWithdrawal && totalWithdrawn > 0 && (
          <InsightCard borderColor="#2dd4bf">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#2dd4bf" }}>
              การถอนเงิน
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              อายุ {policy.withdrawals.startAge}: เริ่มถอน {fmtBaht(policy.withdrawals.monthlyAmount)}/เดือน
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              รวมถอน {fmtBahtShort(totalWithdrawn)}
            </p>
          </InsightCard>
        )}

        {/* Lapse warning OR final value */}
        {lapsesAt ? (
          <InsightCard borderColor="#fb7185">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#fb7185" }}>
              ⚠️ มูลค่าหมด
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              มูลค่าหมดที่อายุ {lapsesAt.age} ปี
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              ลดการถอนหรือเพิ่มเบี้ย
            </p>
          </InsightCard>
        ) : lastRow ? (
          <InsightCard borderColor="#2dd4bf">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#2dd4bf" }}>
              มูลค่ากรมธรรม์
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {fmtBahtShort(lastRow.endValue)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              เมื่ออายุ {lastRow.age} ปี
            </p>
          </InsightCard>
        ) : null}

        {/* Always: summary */}
        <InsightCard borderColor="#60a5fa">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#60a5fa" }}>
            สรุป
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            เบี้ย + ท็อปอัพ {fmtBahtShort(totalPremiumPaid + totalTopUpPaid)}
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            มูลค่าพีค {fmtBahtShort(peakValue)} อายุ {peakAge} ปี
          </p>
        </InsightCard>
      </div>
    </div>
  );
}
