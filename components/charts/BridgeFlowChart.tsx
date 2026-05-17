"use client";

import {
  ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { BridgeResult } from "@/lib/calculations/bridge";

export type HighlightPhase = "endowment" | "maturity" | "health" | null;

interface BridgeFlowChartProps {
  result: BridgeResult;
  highlightPhase?: HighlightPhase;
}

function fmtY(value: number): string {
  const abs = Math.abs(value);
  const fmt =
    abs >= 1_000_000 ? `฿${(abs / 1_000_000).toFixed(1)}M` :
    abs >= 1_000 ? `฿${(abs / 1_000).toFixed(0)}K` :
    `฿${abs}`;
  return value < 0 ? `-${fmt}` : fmt;
}

function fmtBaht(n: number): string {
  return `฿${Math.round(Math.abs(n)).toLocaleString("th-TH")}`;
}

type TooltipPayload = { dataKey: string; value: number; color: string; name: string };

const BridgeTooltip = ({
  active, payload, label,
  maturityAge,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
  maturityAge: number;
}) => {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value as number]));

  return (
    <div
      className="rounded-lg p-3 text-sm shadow-lg"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        อายุ {label} ปี{label === maturityAge ? " · 🎉 ครบสัญญา" : ""}
      </p>
      {byKey["endowmentPremium"] < 0 && (
        <p style={{ color: "#fb7185" }}>เบี้ยสะสมทรัพย์: {fmtBaht(byKey["endowmentPremium"])}/ปี</p>
      )}
      {byKey["lumpSum"] > 0 && (
        <p className="font-bold" style={{ color: "#2dd4bf" }}>รับเงินครบสัญญา: {fmtBaht(byKey["lumpSum"])}</p>
      )}
      {byKey["healthPremium"] < 0 && (
        <p style={{ color: "#f43f5e" }}>เบี้ยสุขภาพ: {fmtBaht(byKey["healthPremium"])}/ปี</p>
      )}
      {byKey["fundBalance"] != null && byKey["fundBalance"] >= 0 && (
        <p className="mt-1 font-semibold" style={{ color: "#2dd4bf" }}>
          เงินคงเหลือ: {fmtBaht(byKey["fundBalance"])}
        </p>
      )}
    </div>
  );
};

function opacity(phase: HighlightPhase, own: HighlightPhase): number {
  if (phase === null) return 0.85;
  return phase === own ? 0.92 : 0.12;
}

export function BridgeFlowChart({ result, highlightPhase = null }: BridgeFlowChartProps) {
  const { dataPoints, maturityAge, healthRunwayAge, adjustedMaturityValue } = result;

  // Compute Y-axis domain — yMin must accommodate the stacked negative total
  const maxPositive = adjustedMaturityValue * 1.12;
  const maxStackedNegative = Math.max(
    ...dataPoints.map((d) => Math.abs(d.endowmentPremium) + Math.abs(d.healthPremium)),
  );
  const yMin = -maxStackedNegative * 1.35;

  // X-axis: show ticks every 5 years, aligned to age mod 5 === 0
  const xTicks: number[] = [];
  for (let age = result.startAge; age <= result.endAge; age++) {
    if (age % 5 === 0) xTicks.push(age);
  }

  const fundExhausted = result.dataPoints.find(
    (d) => d.age > maturityAge && d.fundBalance === 0
  );
  const exhaustionAge = fundExhausted?.age;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={dataPoints} margin={{ top: 32, right: 16, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="gradFund" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.04} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

        <XAxis
          dataKey="age"
          ticks={xTicks}
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
          width={62}
          domain={[yMin, maxPositive]}
        />

        <Tooltip
          content={<BridgeTooltip maturityAge={maturityAge} />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />

        {/* Zero baseline */}
        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />

        {/* Maturity vertical line */}
        <ReferenceLine
          x={maturityAge}
          stroke="#c9a84c"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          label={{
            value: `ได้เงิน ${fmtY(adjustedMaturityValue)}`,
            position: "insideTopRight",
            fontSize: 10,
            fill: "#c9a84c",
          }}
        />

        {/* Fund exhaustion line */}
        {exhaustionAge && exhaustionAge < result.endAge && (
          <ReferenceLine
            x={exhaustionAge}
            stroke="#fb7185"
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{
              value: `เงินหมด อายุ ${exhaustionAge}`,
              position: "insideTopLeft",
              fontSize: 10,
              fill: "#fb7185",
            }}
          />
        )}

        {/* Endowment premium bars (rose, stacked below zero) */}
        <Bar
          dataKey="endowmentPremium"
          name="เบี้ยสะสมทรัพย์"
          stackId="bridge"
          maxBarSize={18}
          isAnimationActive={false}
          fillOpacity={opacity(highlightPhase, "endowment")}
        >
          {dataPoints.map((d) => (
            <Cell key={d.age} fill="#fb7185" />
          ))}
        </Bar>

        {/* Health premium bars (dark rose, stacked below zero under endowment) */}
        <Bar
          dataKey="healthPremium"
          name="เบี้ยสุขภาพ"
          stackId="bridge"
          maxBarSize={18}
          isAnimationActive={false}
          fillOpacity={opacity(highlightPhase, "health")}
        >
          {dataPoints.map((d) => (
            <Cell key={d.age} fill="#f43f5e" />
          ))}
        </Bar>

        {/* Lump sum bar (teal, stacks upward from zero — the hero) */}
        <Bar
          dataKey="lumpSum"
          name="เงินครบสัญญา"
          stackId="bridge"
          maxBarSize={18}
          isAnimationActive={false}
          radius={[4, 4, 0, 0]}
          fillOpacity={opacity(highlightPhase, "maturity")}
        >
          {dataPoints.map((d) => (
            <Cell key={d.age} fill="#2dd4bf" />
          ))}
        </Bar>

        {/* Fund balance line (teal, depleting) */}
        <Line
          type="monotone"
          dataKey="fundBalance"
          name="เงินคงเหลือ"
          stroke="#2dd4bf"
          strokeWidth={2.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
          strokeOpacity={opacity(highlightPhase, "health") > 0.5 ? 0.9 : opacity(highlightPhase, "health") < 0.2 ? 0.12 : 0.9}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
